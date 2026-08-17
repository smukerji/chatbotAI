import clientPromise from "@/db";
import { NextResponse } from "next/server";

/**
 * Shared auth guard for the WhatsApp QR inbox routes: confirms the chatbotId
 * + userId pair actually owns the chatbot in Mongo. Mirrors the same check
 * already used by whatsapp-qr/session/api/route.ts for the pairing flow —
 * getServerSession() is deliberately NOT used here, since it doesn't reliably
 * resolve a session in this app's Route Handlers (see the header/session
 * fallback in chatbot/api/history/route.ts for the same pre-existing issue).
 * Returns an error NextResponse if unauthorized, or null if the request may proceed.
 */
export async function authorizeWhatsappQr(
  chatbotId: string | null,
  userId: string | null
): Promise<NextResponse | null> {
  if (!chatbotId || !userId) {
    return NextResponse.json(
      { error: "chatbotId and userId required" },
      { status: 400 }
    );
  }

  const db = (await clientPromise!).db();
  const owns = await db
    .collection("user-chatbots")
    .findOne({ chatbotId, userId });
  if (!owns) {
    return NextResponse.json({ error: "Chatbot not found" }, { status: 404 });
  }

  return null;
}
