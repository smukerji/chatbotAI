import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "../../../db";

export async function POST(request: any) {
  const options = {
    method: "GET",
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_AUTHORIZATION}`,
      cache: "no-store",
    },
    next: { revalidate: 0 },
  };

  /// read the body from request

  const reader = request.body.getReader();
  const decoder = new TextDecoder("utf-8");

  /// decode the chunks to get userId
  let userId;
  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    // Massage and parse the chunk of data
    const chunk = decoder.decode(value);
    userId = JSON.parse(chunk).userId;
  }

  try {
    /// fetch the chatbot data from chatbase
    const response = await fetch(
      "https://www.chatbase.co/api/v1/get-chatbots",
      options
    );

    if (!response.ok) {
      throw new Error("Error while retriving chatbots");
    }

    const data = await response.json();
    // console.log("Called", data);

    // console.log("Data...........", data);
    /// fetch the custom created chatbots
    const db = await connectDatabase();
    const collection = db.collection("user-details");
    const customeBots: any = collection.find({ userId: userId });
    for await (const doc of customeBots) {
      // console.log(doc.chatbotId, doc.chatbotName);
      const element = { id: doc.chatbotId, name: doc.chatbotName };
      if (!objectExists(data.chatbots, element)) {
        console.log("fre");

        data.chatbots.push(element);
      }
    }

    // console.log(data);

    // console.log("Custom bots", customeBots);

    return NextResponse.json(data);
  } catch (error) {
    console.log("Error in chatbot route", error);
    return NextResponse.json({ error: "Error error" });
  }
}

/// check if the chatbot entry already exist in array
function objectExists(array: any, targetObject: any) {
  return array.some(
    (obj: any) => JSON.stringify(obj) === JSON.stringify(targetObject)
  );
}

export const fetchCache = "force-no-store";
export const revalidate = 0;
