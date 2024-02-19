import { NextResponse } from "next/server";
import twilio from "twilio";
import { connectDatabase } from "../../../db";

// Extract Twilio credentials from environment variables
const { NEXT_PUBLIC_TWILIO_TOKEN, NEXT_PUBLIC_TWILIO_SID } = process.env;

// Initialize Twilio client
const client = twilio(NEXT_PUBLIC_TWILIO_SID, NEXT_PUBLIC_TWILIO_TOKEN);
export async function POST(request: any) {
  // Extracting the chatbot id from the URL
  // const url = request.url;
  // const segment = url.split("/");
  // const chatbotId = segment[segment.length - 2];

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

  try {
    const db = (await connectDatabase()).db();
    const userMessage = body.Body;
    const whatsAppCollection = db.collection("whatsapp-users");
    /// handle the talk-to message
    if (
      // userMessage.length === 44 &&
      userMessage.toLowerCase().includes("talk-to")
    ) {
      const userNo = body.From;
      const activeChatbot = body.Body.split("+")[1];

      const collection = db.collection("user-chatbots");
      const cursor = await collection.findOne({ chatbotId: activeChatbot });

      /// if the chatbot id is invalid
      if (!cursor) {
        const twilioMessage = await client.messages.create({
          body: `Sorry! The entered chatbotID: *${activeChatbot}* is invalid. Please contact the administrator`,
          from: body.To,
          to: body.From,
        });

        return NextResponse.json(twilioMessage.sid);
      } else {
        const existingUser = await whatsAppCollection.findOne({ userNo });

        if (existingUser) {
          // Update the activeChatbot if the userNo exists in MongoDB
          await whatsAppCollection.updateOne(
            { userNo },
            { $set: { activeChatbot } }
          );
        } else {
          // Insert a new document if the userNo doesn't exist
          await whatsAppCollection.insertOne({
            userNo,
            activeChatbot,
          });
        }

        const twilioMessage = await client.messages.create({
          body: `You are all set to talk with *${cursor.chatbotName}* chatbot`,
          from: body.To,
          to: body.From,
        });

        return NextResponse.json(twilioMessage.sid);
      }
    }

    /// get the chatbot associated to the userNumber
    const userInfo = await whatsAppCollection.findOne({ userNo: body.From });
    const chatbotId = userInfo.activeChatbot;

    /// fecth the userId from database
    const collection = db.collection("user-chatbots");
    const cursor = await collection.findOne({ chatbotId: chatbotId });

    /// handle the error if chatbot is errornous
    if (!cursor) {
      const twilioMessage = await client.messages.create({
        body: `Sorry! The chatbot you are trying to interact with either doesn't exist or the associated chatbotID: *${chatbotId}* is invalid. Please contact the administrator`,
        from: body.To,
        to: body.From,
      });

      return NextResponse.json(twilioMessage.sid);
    } else {
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
                context:
                ${similaritySearchResults}
                
                Answer user query and include images write respect to each line if available`,
              },
              // ...messages,
              {
                role: "user",
                content: `Answer user query and include images in response if available in the given context 
              
                          query: ${body.Body} `,
              },
            ],
          }),
        }
      );

      const openaiBody = JSON.parse(await responseOpenAI.text());
      console.log(openaiBody.choices[0].message.content);

      // Send the response message via Twilio
      const twilioMessage = await client.messages.create({
        body: openaiBody.choices[0].message.content,
        from: body.To,
        to: body.From,
      });

      // console.log(twilioMessage.sid);

      return NextResponse.json(twilioMessage.sid);
    }
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
