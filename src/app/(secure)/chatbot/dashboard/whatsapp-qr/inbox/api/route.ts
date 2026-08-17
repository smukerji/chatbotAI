import clientPromise from "@/db";
import { NextRequest, NextResponse } from "next/server";
import { authorizeWhatsappQr } from "../../_lib/authorize";

const HISTORY_COLLECTION = "whatsapp-qr-chat-history";

function transformMessage(msg: any) {
  return {
    content: msg.content,
    timestamp: msg.timestamp,
    isFromUser: msg.role === "user",
    isFromBot: msg.role === "assistant",
    // True for messages the account owner sent themselves — either directly
    // from the WhatsApp app on their phone, or (historically) via the
    // dashboard — as opposed to an AI-generated reply.
    isOwnerSent: msg.sentBy === "agent",
  };
}

/**
 * GET /chatbot/dashboard/whatsapp-qr/inbox/api?chatbotId=&userId=[&phoneNumber=]
 *
 * List mode (no phoneNumber): one entry per contact, holding only their most
 * recent message — cheap enough to poll every few seconds.
 * Single-chat mode (phoneNumber given): the full transcript for that contact,
 * concatenated across every date-partitioned document.
 */
export async function GET(req: NextRequest) {
  try {
    const chatbotId = req.nextUrl.searchParams.get("chatbotId");
    const userId = req.nextUrl.searchParams.get("userId");
    const phoneNumberParam = req.nextUrl.searchParams.get("phoneNumber");

    const unauthorized = await authorizeWhatsappQr(chatbotId, userId);
    if (unauthorized) return unauthorized;

    const db = (await clientPromise!).db();
    const historyCol = db.collection(HISTORY_COLLECTION);

    if (phoneNumberParam) {
      const phoneKey = phoneNumberParam.replace(/\D/g, "");
      const docs = await historyCol
        .find(
          { userId, chatbotId, [`chats.${phoneKey}`]: { $exists: true } },
          { projection: { date: 1, [`chats.${phoneKey}`]: 1 } }
        )
        .sort({ date: 1 })
        .toArray();

      // Concatenate (never overwrite) — the same phoneKey legitimately repeats
      // across many date-docs, one per day of conversation.
      let allMessages: any[] = [];
      for (const doc of docs) {
        const messages = (doc as any).chats?.[phoneKey]?.messages || [];
        allMessages = allMessages.concat(messages);
      }
      allMessages.sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      const transformed = allMessages.map(transformMessage);
      const lastMessage = transformed[transformed.length - 1];

      return NextResponse.json({
        chat: {
          phoneNumber: phoneKey,
          allMessages: transformed,
          totalMessages: transformed.length,
          lastUpdate: lastMessage?.timestamp ?? null,
        },
      });
    }

    const pipeline = [
      { $match: { userId, chatbotId } },
      { $project: { chatsArray: { $objectToArray: "$chats" } } },
      { $unwind: "$chatsArray" },
      {
        $project: {
          _id: 0,
          phoneKey: "$chatsArray.k",
          count: { $size: { $ifNull: ["$chatsArray.v.messages", []] } },
          lastMessage: {
            $arrayElemAt: [{ $ifNull: ["$chatsArray.v.messages", []] }, -1],
          },
        },
      },
      { $match: { lastMessage: { $ne: null } } },
      { $sort: { "lastMessage.timestamp": 1 as const } },
      {
        $group: {
          _id: "$phoneKey",
          totalMessages: { $sum: "$count" },
          lastMessage: { $last: "$lastMessage" },
        },
      },
      { $sort: { "lastMessage.timestamp": -1 as const } },
    ];

    const results = await historyCol.aggregate(pipeline).toArray();

    const chats = results.map((r: any) => {
      const lastMessage = transformMessage(r.lastMessage);
      return {
        phoneNumber: r._id,
        allMessages: [lastMessage],
        totalMessages: r.totalMessages,
        lastUpdate: lastMessage.timestamp,
      };
    });

    return NextResponse.json({ chats });
  } catch (err: any) {
    console.error("[WA-QR inbox GET] error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
