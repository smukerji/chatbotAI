import clientPromise from "@/db";
import { NextRequest, NextResponse } from "next/server";
import { authorizeWhatsappQr } from "../../_lib/authorize";

/**
 * GET /chatbot/dashboard/whatsapp-qr/auto-reply/api?chatbotId=&userId=
 * Returns the phone numbers currently in manual mode (AI auto-reply OFF).
 */
export async function GET(req: NextRequest) {
  try {
    const chatbotId = req.nextUrl.searchParams.get("chatbotId");
    const userId = req.nextUrl.searchParams.get("userId");

    const unauthorized = await authorizeWhatsappQr(chatbotId, userId);
    if (unauthorized) return unauthorized;

    const db = (await clientPromise!).db();
    const doc = await db
      .collection("whatsapp_qr_sessions")
      .findOne({ chatbotId }, { projection: { manualNumbers: 1 } });

    return NextResponse.json({ numbers: doc?.manualNumbers || [] });
  } catch (err: any) {
    console.error("[WA-QR auto-reply GET] error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * POST /chatbot/dashboard/whatsapp-qr/auto-reply/api
 * Body: { chatbotId, userId, phoneNumber, enable }
 * enable:true switches the contact to manual mode (AI auto-reply OFF).
 * enable:false switches it back to AI auto-reply.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { chatbotId, userId, phoneNumber, enable } = body;

    const unauthorized = await authorizeWhatsappQr(chatbotId, userId);
    if (unauthorized) return unauthorized;

    if (!phoneNumber) {
      return NextResponse.json({ error: "phoneNumber is required" }, { status: 400 });
    }

    const phoneKey = String(phoneNumber).replace(/\D/g, "");
    const db = (await clientPromise!).db();
    const sessionsCol = db.collection("whatsapp_qr_sessions");

    const existing = await sessionsCol.findOne({ chatbotId });
    if (!existing) {
      return NextResponse.json({ error: "No WhatsApp QR session found" }, { status: 404 });
    }

    await sessionsCol.updateOne(
      { chatbotId },
      enable
        ? { $addToSet: { manualNumbers: phoneKey } }
        : { $pull: { manualNumbers: phoneKey as any } }
    );

    const updated = await sessionsCol.findOne(
      { chatbotId },
      { projection: { manualNumbers: 1 } }
    );

    return NextResponse.json({ numbers: updated?.manualNumbers || [] });
  } catch (err: any) {
    console.error("[WA-QR auto-reply POST] error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
