import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/db";

export const runtime = "nodejs";

/**
 * One-time migration: upgrade all chatbots that have an assistantType
 * (i.e. were created via the Create Assistant flow) to botType "bot-v2"
 * so they use the Responses API / ChatV2 component.
 *
 * Optionally pass ?chatbotId=xxx to upgrade a single chatbot only.
 *
 * GET /api/admin/migrate-bottype
 * GET /api/admin/migrate-bottype?chatbotId=asst_xxx
 */
export async function GET(request: NextRequest) {
  const db = (await clientPromise!).db();
  const collection = db.collection("user-chatbots");

  const chatbotId = request.nextUrl.searchParams.get("chatbotId");

  // Build filter
  const filter: any = chatbotId
    ? { chatbotId }                          // single chatbot
    : { assistantType: { $exists: true } };  // all assistant-type chatbots

  // Dry-run: show what would be updated
  const preview = await collection.find(filter).toArray();

  // Perform the update
  const result = await collection.updateMany(filter, {
    $set: { botType: "bot-v2" },
  });

  return NextResponse.json({
    matched: result.matchedCount,
    modified: result.modifiedCount,
    chatbots: preview.map((c: any) => ({
      chatbotId: c.chatbotId,
      chatbotName: c.chatbotName,
      assistantType: c.assistantType,
      oldBotType: c.botType,
      newBotType: "bot-v2",
    })),
  });
}
