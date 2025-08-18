import { NextRequest, NextResponse } from "next/server";
import clientPromise from "../../../../../../../db";
import { cookies } from "next/headers";
import { ObjectId } from "mongodb";

export async function GET(req: NextRequest) {
    const cookieStore = cookies();
    const userIdStr = cookieStore.get("userId")?.value;
    const assistantId = req.nextUrl.searchParams.get("assistantId");

    if (!userIdStr || !assistantId) return NextResponse.json({ connected: false, tools: [] });

    let userId: ObjectId;
    try { userId = new ObjectId(userIdStr); } catch { return NextResponse.json({ connected: false, tools: [] }); }

    const db = (await clientPromise!).db();
    const data = await db.collection("google-calendar-oauth-consent").findOne({ userId, assistantId });

    // tools: always array
    const tools = Array.isArray(data?.tools)
        ? data.tools
        : data?.tools
            ? [data.tools]
            : [];

    if (data && data.tokens && data.code) {
        const email = data.google_user_info?.email ?? null;
        const name = data.google_user_info?.name ?? null;
        return NextResponse.json({ connected: true, email, name, tools });
    }
    return NextResponse.json({ connected: false, tools });
}