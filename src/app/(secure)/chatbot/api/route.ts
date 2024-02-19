import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "../../../../db";
import { apiHandler } from "../../../_helpers/server/api/api-handler";

module.exports = apiHandler({
  POST: fetchBots,
});

async function fetchBots(request: any) {
  // Read the body from the request
  const { userId } = await request.json();

  try {
    // Fetch the chatbot data from chatbase and custom chatbots from the database concurrently
    // const [chatbaseResponse, customBots] = await Promise.all([
    //   fetch("https://www.chatbase.co/api/v1/get-chatbots", options),
    //   fetchCustomBots(userId),
    // ]);

    /// Fetch the chatbot data of custom chatbots from the database concurrently
    const [customBots] = await Promise.all([fetchCustomBots(userId)]);

    // if (!chatbaseResponse.ok) {
    //   throw new Error("Error while retrieving chatbots from chatbase");
    // }

    // const chatbaseData = await chatbaseResponse.json();

    // Process custom chatbots and merge them with chatbase data
    // const mergedChatbots = mergeCustomBots(chatbaseData.chatbots, customBots);

    return { chatbots: customBots };
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

  //// default chatbot set temporary
  // const customBots = await collection
  //   ?.find({
  //     $or: [
  //       { userId: userId },
  //       {
  //         chatbotId: "123d148a-be02-4749-a612-65be9d96266c",
  //       },
  //       {
  //         chatbotId: "34cceb84-07b9-4b3e-ad6f-567a1c8f3557",
  //       },
  //       {
  //         chatbotId: "f0893732-3302-46b2-922a-95e79ef3524c",
  //       },
  //       { chatbotId: "f8095ef4-6cd0-4373-a45e-8fe15cb6dd0f" },
  //     ],
  //   })
  //   .toArray();

  /// default chatbot set temporary
  const customBots = await collection
    .aggregate([
      {
        $match: {
          $or: [
            { userId: userId },
            {
              chatbotId: {
                $in: [
                  "123d148a-be02-4749-a612-65be9d96266c",
                  "34cceb84-07b9-4b3e-ad6f-567a1c8f3557",
                  "f0893732-3302-46b2-922a-95e79ef3524c",
                  "f8095ef4-6cd0-4373-a45e-8fe15cb6dd0f",
                ],
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: "chatbot-settings",
          localField: "chatbotId",
          foreignField: "chatbotId",
          as: "chatbotSettings",
          /// this will only include the field needed from chatbot settings
          pipeline: [
            {
              $project: {
                _id: 0,
                lastTrained: 1,
                numberOfCharacterTrained: 1,
              },
            },
          ],
        },
      },

      {
        $group: {
          _id: "$_id",
          userId: { $first: "$userId" },
          chatbotId: { $first: "$chatbotId" },
          chatbotName: { $first: "$chatbotName" },
          lastUsed: { $first: "$lastUsed" },
          noOfMessagesSent: { $first: "$noOfMessagesSent" },
          chatbotSettings: { $push: "$chatbotSettings" },
        },
      },
    ])
    .toArray();

  return customBots.map((doc: any) => ({
    id: doc.chatbotId,
    name: doc.chatbotName,
    lastUsed: doc?.lastUsed,
    noOfMessagesSent: doc?.noOfMessagesSent,
    lastTrained: doc.chatbotSettings[0][0]?.lastTrained,
    numberOfCharacterTrained:
      doc.chatbotSettings[0][0]?.numberOfCharacterTrained,
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
