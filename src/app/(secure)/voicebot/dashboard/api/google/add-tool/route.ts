import { NextRequest, NextResponse } from "next/server";

import { ObjectId } from "mongodb";
import clientPromise from "@/db";

export async function POST(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const userIdStr = searchParams.get("userId");
    const assistantId = searchParams.get("assistantId");
    const tool = searchParams.get("tool");

    if (!userIdStr || !assistantId || !tool) {
        return NextResponse.json({ success: false, message: "Missing params", tools: [] });
    }

    let userId: ObjectId;
    try { userId = new ObjectId(userIdStr); } catch { return NextResponse.json({ success: false, message: "Invalid userId", tools: [] }); }

    const db = (await clientPromise!).db();

    // Only add tool if OAuth tokens exist
    const data = await db.collection("google-calendar-oauth-consent").findOne({ userId, assistantId });
    if (!data || !data.tokens || !data.code) {
        return NextResponse.json({ success: false, message: "OAuth not completed", tools: [] });
    }

    await db.collection("google-calendar-oauth-consent").updateOne(
        { userId, assistantId },
        { $addToSet: { tools: tool } }
    );

    // Fetch updated tools array
    const updated = await db.collection("google-calendar-oauth-consent").findOne({ userId, assistantId });
    const tools = Array.isArray(updated?.tools)
        ? updated.tools
        : updated?.tools
            ? [updated.tools]
            : [];

    return NextResponse.json({ success: true, tools });
}