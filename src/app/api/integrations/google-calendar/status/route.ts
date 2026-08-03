import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/db";

/**
 * GET /api/integrations/google-calendar/status?chatbotId=xxx
 *
 * Returns whether a Google Calendar account is connected for the given chatbot
 * and when it was connected.
 */
export async function GET(req: NextRequest) {
  const chatbotId = req.nextUrl.searchParams.get("chatbotId");

  if (!chatbotId) {
    return NextResponse.json(
      { error: "chatbotId is required" },
      { status: 400 }
    );
  }

  const db = (await clientPromise!).db();
  const tokenDoc = await db
    .collection("google-calendar-tokens")
    .findOne({ chatbotId }, { projection: { connectedAt: 1, _id: 0 } });

  return NextResponse.json({
    connected: !!tokenDoc,
    connectedAt: tokenDoc?.connectedAt ?? null,
  });
}

/**
 * DELETE /api/integrations/google-calendar/status?chatbotId=xxx
 *
 * Disconnects (removes tokens) for the given chatbot.
 */
export async function DELETE(req: NextRequest) {
  const chatbotId = req.nextUrl.searchParams.get("chatbotId");

  if (!chatbotId) {
    return NextResponse.json(
      { error: "chatbotId is required" },
      { status: 400 }
    );
  }

  const db = (await clientPromise!).db();
  await db
    .collection("google-calendar-tokens")
    .deleteOne({ chatbotId });

  return NextResponse.json({ success: true });
}
