import { NextResponse } from "next/server";
import twilio from "twilio";
import { connectDatabase } from "../../../../db";

// Extract Twilio credentials from environment variables
const {
  NEXT_PUBLIC_TWILIO_TOKEN,
  NEXT_PUBLIC_TWILIO_SID,
  NEXT_PUBLIC_AUTHORIZATION,
} = process.env;

// Initialize Twilio client
const client = twilio(NEXT_PUBLIC_TWILIO_SID, NEXT_PUBLIC_TWILIO_TOKEN);

export async function POST(request: any) {
  // Extracting the chatbot id from the URL
  const url = request.url;
  const segment = url.split("/");
  const chatbotId = segment[segment.length - 2];

  // Read the request body as a stream
  const reader = request.body.getReader();
  const decoder = new TextDecoder("utf-8");

  // Accumulate the request body text
  let bodyText = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    const chunk = decoder.decode(value);
    bodyText += chunk;
  }

  // Parse the request body into key-value pairs
  const keyValuePairs = bodyText.split("&");
  const body: any = {};
  keyValuePairs.forEach((keyValuePair) => {
    const [key, value] = keyValuePair.split("=");
    body[key] = decodeURIComponent(value);
  });

  if (chatbotId.length != 36) {
    try {
      // Prepare options for Chatbase API request
      const options = {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          Authorization: `Bearer ${NEXT_PUBLIC_AUTHORIZATION}`,
          cache: "no-store",
        },
        body: JSON.stringify({
          temperature: 0,
          chatId: chatbotId,
          messages: [{ role: "user", content: body.Body }],
        }),
      };

      // Send user query to Chatbase API
      const response = await fetch(
        "https://www.chatbase.co/api/v1/chat",
        options
      );
      if (!response.ok) {
        throw new Error(
          `Error when getting user query response in WhatsApp chat`
        );
      }

      // Read and parse the response from Chatbase API
      const resptext = await response.text();
      const messageReply = JSON.parse(resptext);

      console.log(messageReply.text);

      // Send the response message via Twilio
      const twilioMessage = await client.messages.create({
        body: messageReply.text,
        from: body.To,
        to: body.From,
      });

      console.log(twilioMessage.sid);

      return NextResponse.json(messageReply);
    } catch (error: any) {
      console.log("Error", error);
      return NextResponse.json(error);
    }
  } else {
    try {
      /// fecth the userId from database
      const db = (await connectDatabase()).db();
      const collection = db.collection("user-chatbots");
      const cursor = await collection.findOne({ chatbotId: chatbotId });

      /// get similarity search
      const response: any = await fetch(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}api/pinecone`,
        {
          method: "POST",
          body: JSON.stringify({
            userQuery: body.Body,
            chatbotId: chatbotId,
            userId: cursor?.userId,
          }),
        }
      );

      /// parse the response and extract the similarity results
      const respText = await response.text();
      const similaritySearchResults = JSON.parse(respText).join("\n");

      // Fetch the response from the OpenAI API
      const responseOpenAI: any = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENAI_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            temperature: 0.5,
            top_p: 1,
            messages: [
              {
                role: "system",
                content: `Use the following pieces of context to answer the users question.
      If you don't know the answer, just say that you don't know, don't try to make up an answer.
      ----------------
      ${similaritySearchResults}`,
              },
              // ...messages,
              { role: "user", content: body.Body },
            ],
          }),
        }
      );

      // Send the response message via Twilio
      const twilioMessage = await client.messages.create({
        body: JSON.parse(await responseOpenAI.text()).choices[0].message
          .content,
        from: body.To,
        to: body.From,
      });

      // console.log(twilioMessage.sid);

      return NextResponse.json(twilioMessage.sid);
    } catch (e: any) {
      console.log(
        "Error while getting completion from custom chatbot",
        e.message
      );
      return NextResponse.json(
        `Error while getting completion from custom chatbot,
        ${e.message}`
      );
    }
  }
}
