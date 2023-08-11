import { NextResponse } from "next/server";
import twilio from "twilio";

// Extract Twilio credentials from environment variables
const {
  NEXT_PUBLIC_TWILIO_TOKEN,
  NEXT_PUBLIC_TWILIO_SID,
  NEXT_PUBLIC_AUTHORIZATION,
} = process.env;

// Initialize Twilio client
const client = twilio(NEXT_PUBLIC_TWILIO_SID, NEXT_PUBLIC_TWILIO_TOKEN);

export async function POST(request: any) {
  try {
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
}
