import { apiHandler } from "@/app/_helpers/server/api/api-handler";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/db";
import joi from "joi";
import { ObjectId } from "mongodb";
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
  const chatbotId = request.nextUrl.searchParams.get("chatbotId");

  const startDate = request.nextUrl.searchParams
    .get("startDate")
    ?.replaceAll("-", "/");
  const userId = request?.headers.get("userId")
    ? request?.headers.get("userId")
    : session?.user?.id;
  const endDate = request.nextUrl.searchParams
    .get("endDate")
    ?.replaceAll("-", "/");
  const filterSource = request.nextUrl.searchParams.get("filterSource");
  let date: any = null;
  let historyCursor = null;

  if (startDate != "null" && endDate != "null") {
    date = {
      $gte: startDate!, // Start date
      $lte: endDate!, // End date
    };
  }

  /// function to retrive chat history
  async function retriveChatHistory() {
    /// this is to get only the chat history
    if (filterSource === "history") {
      const chatHistory = db.collection("chat-history");
      const page = parseInt(request.nextUrl.searchParams.get("page")!) || 1;
      const pageSize =
        parseInt(request.nextUrl.searchParams.get("pageSize")!) || 10;

      let historyResults: any = {};

      /// timestamp is used to get the history between the start and end date
      if (date) {
        historyCursor = await chatHistory
          .find({
            chatbotId: chatbotId,
            userId: userId,
            date,
          })
          .project({
            chatbotId: 0,
            userId: 0,
          })
          // .skip((page - 1) * pageSize)
          // .limit(pageSize)
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
          // .skip((page - 1) * pageSize)
          // .limit(pageSize)
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
    } else if (filterSource === "lead-history") {
      let historyResults: any = {};

      /// this is used to get the history specific to the leads
      const leadsCollection = db.collection("leads");
      /// first get the leads with the email
      const email = request.nextUrl.searchParams.get("email");
      const leadsCursor = await leadsCollection.findOne({
        chatbotId: chatbotId,
        userId: userId,
        "leadDetails.email": email,
      });

      /// get all the chats of the lead from the chat history collection
      const sessionData: any = Object.entries(leadsCursor.sessions);
      for (const [lead0, lead1] of sessionData) {
        const historyCursor = await db
          .collection("chat-history")
          .findOne({ _id: new ObjectId(lead0) });

        /// filter the chats of the lead
        const filterChats = Object.entries(historyCursor.chats).filter(
          (chat: any) => {
            return lead1.includes(chat[0]);
          }
        );

        for (const [chat0, chat1] of filterChats) {
          historyResults["chats"] = {
            ...historyResults["chats"],
            [chat0]: chat1,
          };
        }
      }

      return {
        historyResults: historyResults,
        chatsCount: 0,
      };
    }
  }

  const history: any = await retriveChatHistory();
  return {
    historyCount: history.chatsCount,
    chatHistory: history.historyResults,
  };
}

module.exports = apiHandler({
  GET: getConversationHistory,
});
