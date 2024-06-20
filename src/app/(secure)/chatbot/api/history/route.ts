import { apiHandler } from "@/app/_helpers/server/api/api-handler";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/db";
import joi from "joi";
import { getServerSession } from "next-auth";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { start } from "repl";

/// function to get leads
async function getConversationHistory(request: NextRequest) {
  /// get the session and then access the id
  const session: any = await getServerSession(authOptions);

  /// check if the api is used to count the leads or to get the leads
  const db = (await clientPromise!).db();
  const chatHistory = db.collection("chat-history");
  const chatbotId = request.nextUrl.searchParams.get("chatbotId");
  const startDate = request.nextUrl.searchParams.get("startDate");
  const userId = request?.headers.get("userId")
    ? request?.headers.get("userId")
    : session?.user?.id;
  const endDate = request.nextUrl.searchParams.get("endDate");
  let timestamp: any = null;
  let historyCursor = null;
  let historyCount = null;

  if (startDate != "null" && endDate != "null") {
    timestamp = {
      $gte: new Date(startDate!), // Start date
      $lte: new Date(endDate + "T23:59:59"), // End date
    };
  }

  /// function to retrive chat history
  async function retriveChatHistory() {
    const page = parseInt(request.nextUrl.searchParams.get("page")!) || 1;
    const pageSize =
      parseInt(request.nextUrl.searchParams.get("pageSize")!) || 10;

    let historyResults: any = {};

    /// timestamp is used to get the history between the start and end date
    if (timestamp) {
      historyCursor = await chatHistory
        .find({
          chatbotId: chatbotId,
          userId: userId,
          timestamp,
        })
        .project({
          chatbotId: 0,
          userId: 0,
        })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .toArray();
    } else {
      historyCursor = await chatHistory
        .find({
          chatbotId: chatbotId,
          userId: userId,
        })
        .project({
          chatbotId: 0,
          userId: 0,
        })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .toArray();
    }

    // Flatten historyDetails
    let chatsCount = 0;
    historyCursor.forEach((history: any) => {
      chatsCount += Object.entries(history.chats).length;
      historyResults["chats"] = {
        ...historyResults["chats"],
        ...history.chats,
      };
    });

    return { historyResults, chatsCount };
  }

  const history = await retriveChatHistory();
  return {
    historyCount: history.chatsCount,
    chatHistory: history.historyResults,
  };
}

module.exports = apiHandler({
  GET: getConversationHistory,
});
