import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "../../../../db";
import { apiHandler } from "../../../_helpers/server/api/api-handler";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../api/auth/[...nextauth]/route";

module.exports = apiHandler({
  POST: fetchBots,
});

async function fetchBots(request: NextRequest) {
  /// get the session and then access the id
  const session: any = await getServerSession(authOptions);
  const userId = request?.headers.get("userId")
    ? request?.headers.get("userId")
    : session?.user?.id;

  try {
    /// Fetch the chatbot data of custom chatbots from the database concurrently
    const [customBots] = await Promise.all([fetchCustomBots(userId)]);
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

  /// default chatbot set temporary
  const cursor = await collection.aggregate([
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
        createdAt: { $first: "$createdAt" },
        chatbotSettings: { $push: "$chatbotSettings" },
      },
    },
    {
      /// sorting in ascending order
      $sort: {
        createdAt: 1,
      },
    },
  ]);

  const customBots = await cursor.toArray();

  /// close the cursor
  await cursor.close();

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

export const fetchCache = "force-no-store";
export const revalidate = 0;
