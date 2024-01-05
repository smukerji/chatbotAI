import { NextRequest } from "next/server";
import { apiHandler } from "../../../../../_helpers/server/api/api-handler";
import { NextApiRequest } from "next";
import { connectDatabase } from "../../../../../../db";
import { getDate } from "../../../../../_helpers/client/getTime";

module.exports = apiHandler({
  POST: retriveChatbotSettings,
  PUT: updateChatbotSettings,
});

type ChatData = {
  messages: any[]; // Replace `any[]` with the actual type if possible
  sessionStartDate: string;
  sessionEndDate: string;
};

type Chats = {
  [key: string]: ChatData;
};

async function retriveChatbotSettings(request: NextRequest) {
  const body = await request.json();
  // Accessing chatbotId from body
  const chatbotId = body?.chatbotId;
  // Accessing userId from body
  const userId = body?.userId;

  const db = (await connectDatabase())?.db();
  const collection = db.collection("chat-history");

  const data = await collection.findOne({
    userId: userId,
    chatbotId: chatbotId,
    date: getDate().split(" ")[0],
  });

  // const chatHistory: Chats = data?.chats;
  // console.log(chatHistory);

  // const startDate = "2023-12-21 15:31:00";
  // const endDate = "2023-12-21 15:33:00";

  // const filteredChats: any = {};

  // for (const [chatId, chatData] of Object.entries(chatHistory)) {
  //   const startTimestamp = new Date(chatData?.sessionStartDate).getTime();
  //   const endTimestamp = new Date(chatData?.sessionEndDate).getTime();
  //   const targetStartTimestamp = new Date(startDate).getTime();
  //   const targetEndTimestamp = new Date(endDate).getTime();

  //   if (
  //     startTimestamp >= targetStartTimestamp &&
  //     endTimestamp <= targetEndTimestamp
  //   ) {
  //     filteredChats[chatId] = chatData;
  //   }
  // }

  // //   return filteredChats;
  // console.log("Flier>>", filteredChats);

  return { chatHistory: data?.chats };
}

async function updateChatbotSettings(request: NextRequest) {
  const body = await request.json();
  // Accessing chatbotId from body
  const chatbotId = body?.chatbotId;
  // Accessing userId from body
  const userId = body?.userId;
  /// Chatbot name if renaming is present
  const chatbotRename = body?.chatbotRename;

  /// if rename is not ""
  if (chatbotRename !== "") {
    const db = (await connectDatabase())?.db();
    const collection = db.collection("user-chatbots");

    /// update the name
    await collection.updateOne(
      {
        userId: userId,
        chatbotId: chatbotId,
      },
      { $set: { chatbotName: chatbotRename } }
    );
  }

  return { message: "Chatbot Updated successfully..." };
}
