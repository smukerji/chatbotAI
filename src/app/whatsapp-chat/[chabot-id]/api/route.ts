import { NextResponse } from "next/server";
import twilio from "twilio";

/// extract the auth and secret token of twilio
const {
  NEXT_PUBLIC_TWILIO_TOKEN,
  NEXT_PUBLIC_TWILIO_SID,
  NEXT_PUBLIC_AUTHORIZATION,
} = process.env;
const client = twilio(NEXT_PUBLIC_TWILIO_SID, NEXT_PUBLIC_TWILIO_TOKEN);

export async function POST(request: any) {
  /// extracting the chatbot id
  const url = request.url;
  const segment = url.split("/");
  const chatbotId = segment[segment.length - 2];

  /// decoding the readable stream
  const reader = request.body.getReader();
  const decoder = new TextDecoder("utf-8");

  // Initialize an empty object to store the parsed data
  const body: any = {};
  let bodyText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      /// converting the string to json object
      /// split the string
      const keyValuePairs = bodyText.split("&");

      /// create key value pair json object
      keyValuePairs.forEach((keyValuePair) => {
        const [key, value] = keyValuePair.split("=");
        body[key] = decodeURIComponent(value);
      });
      // parsed the body from twilio

      // All data has been read
      break;
    }
    const chunk = decoder.decode(value);
    // Process the 'value' (data chunk) here
    bodyText += chunk;
  }

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

  try {
    console.log("Above response");

    const response: any = await fetch(
      "https://www.chatbase.co/api/v1/chat",
      options
    );
    // Read the response as a stream of data
    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");

    /// decode the chunks
    let resptext = "";
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      // Massage and parse the chunk of data
      const chunk = decoder.decode(value);
      resptext += chunk;
    }
    const messageReply = JSON.parse(resptext);
    console.log(messageReply.text);
    console.log("AFter response");

    if (!response.ok) {
      throw new Error(` when getting user query response in whatsapp chat`);
    }
    /// send the response from the arrived message
    client.messages
      .create({
        body: messageReply.text,
        from: body.To,
        to: body.From,
      })
      .then((message) => console.log(message.sid));
    return NextResponse.json(messageReply);
  } catch (error: any) {
    console.log("Error", error);
    return NextResponse.json(error);
  }
}
