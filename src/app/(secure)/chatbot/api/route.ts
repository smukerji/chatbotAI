import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "../../../../db";
import { apiHandler } from "../../../_helpers/server/api/api-handler";

module.exports = apiHandler({
  POST: fetchBots,
});

async function fetchBots(request: any) {
  const options = {
    method: "GET",
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_AUTHORIZATION}`,
      cache: "no-store",
    },
    next: { revalidate: 0 },
  };

  // Read the body from the request
  const { userId } = await request.json();

  try {
    // Fetch the chatbot data from chatbase and custom chatbots from the database concurrently
    const [chatbaseResponse, customBots] = await Promise.all([
      fetch("https://www.chatbase.co/api/v1/get-chatbots", options),
      fetchCustomBots(userId),
    ]);

    if (!chatbaseResponse.ok) {
      throw new Error("Error while retrieving chatbots from chatbase");
    }

    const chatbaseData = await chatbaseResponse.json();

    // Process custom chatbots and merge them with chatbase data
    const mergedChatbots = mergeCustomBots(chatbaseData.chatbots, customBots);

    return { chatbots: mergedChatbots };
  } catch (error) {
    console.log("Error in chatbot route", error);
    return { error: `Error ${error}` };
  }
}

// Fetch custom chatbots from the database
async function fetchCustomBots(userId: string) {
  const db = (await connectDatabase())?.db();
  // console.log("Database ", db);

  const collection = db?.collection("user-chatbots");
  // console.log("Collection ", collection);

  const customBots = await collection?.find({ userId: userId }).toArray();
  return customBots.map((doc: any) => ({
    id: doc.chatbotId,
    name: doc.chatbotName,
  }));
}

// Merge custom chatbots with chatbase chatbots
function mergeCustomBots(chatbaseChatbots: any[], customBots: any[]) {
  const mergedChatbots = [...chatbaseChatbots];
  for (const customBot of customBots) {
    if (!objectExists(mergedChatbots, customBot)) {
      mergedChatbots.push(customBot);
    }
  }
  return mergedChatbots;
}

// Check if the chatbot entry already exists in the array
function objectExists(array: any, targetObject: any) {
  return array.some(
    (obj: any) => JSON.stringify(obj) === JSON.stringify(targetObject)
  );
}

export const fetchCache = "force-no-store";
export const revalidate = 0;
