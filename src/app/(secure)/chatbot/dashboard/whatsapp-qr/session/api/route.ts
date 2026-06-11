import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/db";

const WA_SERVER_URL = process.env.WHATSAPP_SERVER_URL?.replace(/\/$/, "");
const WA_SECRET = process.env.WHATSAPP_SERVER_SECRET || "";

function waHeaders(): HeadersInit {
  return { "Content-Type": "application/json", "x-wa-secret": WA_SECRET };
}

async function validateOwnership(chatbotId: string, userId: string) {
  const db = (await clientPromise!).db();
  const doc = await db.collection("user-chatbots").findOne({ chatbotId, userId });
  console.log("[WA-QR] validateOwnership chatbotId:", chatbotId, "userId:", userId, "found:", !!doc);
  return Boolean(doc);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { chatbotId, userId } = body;
    console.log("[WA-QR POST] chatbotId:", chatbotId, "userId:", userId);

    if (!WA_SERVER_URL) return NextResponse.json({ error: "WhatsApp server not configured" }, { status: 503 });
    if (!chatbotId || !userId) return NextResponse.json({ error: "chatbotId and userId required" }, { status: 400 });

    const owns = await validateOwnership(chatbotId, userId);
    if (!owns) return NextResponse.json({ error: "Chatbot not found" }, { status: 404 });

    const upstream = await fetch(`${WA_SERVER_URL}/wa-qr/start/${chatbotId}`, {
      method: "POST", headers: waHeaders(), body: JSON.stringify({ userId }),
      signal: AbortSignal.timeout(10_000),
    });
    return NextResponse.json(await upstream.json(), { status: upstream.status });
  } catch (err: any) {
    console.error("[WA-QR POST] error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const chatbotId = req.nextUrl.searchParams.get("chatbotId");
    const userId = req.nextUrl.searchParams.get("userId");
    console.log("[WA-QR GET] chatbotId:", chatbotId, "userId:", userId);

    if (!WA_SERVER_URL) return NextResponse.json({ error: "WhatsApp server not configured" }, { status: 503 });
    if (!chatbotId || !userId) return NextResponse.json({ error: "chatbotId and userId required" }, { status: 400 });

    const owns = await validateOwnership(chatbotId, userId);
    if (!owns) return NextResponse.json({ error: "Chatbot not found" }, { status: 404 });

    const upstream = await fetch(`${WA_SERVER_URL}/wa-qr/status/${chatbotId}`, {
      method: "GET", headers: waHeaders(), signal: AbortSignal.timeout(10_000),
    });
    return NextResponse.json(await upstream.json(), { status: upstream.status });
  } catch (err: any) {
    console.error("[WA-QR GET] error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const chatbotId = req.nextUrl.searchParams.get("chatbotId");
    const userId = req.nextUrl.searchParams.get("userId");

    if (!WA_SERVER_URL) return NextResponse.json({ error: "WhatsApp server not configured" }, { status: 503 });
    if (!chatbotId || !userId) return NextResponse.json({ error: "chatbotId and userId required" }, { status: 400 });

    const owns = await validateOwnership(chatbotId, userId);
    if (!owns) return NextResponse.json({ error: "Chatbot not found" }, { status: 404 });

    const upstream = await fetch(`${WA_SERVER_URL}/wa-qr/disconnect/${chatbotId}`, {
      method: "DELETE", headers: waHeaders(), signal: AbortSignal.timeout(10_000),
    });
    return NextResponse.json(await upstream.json(), { status: upstream.status });
  } catch (err: any) {
    console.error("[WA-QR DELETE] error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
