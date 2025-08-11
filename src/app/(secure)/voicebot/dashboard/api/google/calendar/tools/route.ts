import { NextRequest, NextResponse } from "next/server";
import clientPromise from "../../../../../../../../db";
import { cookies } from "next/headers";
import { ObjectId } from "mongodb";

export async function PUT(req: NextRequest) {
    const cookieStore = cookies();
    const userIdStr = cookieStore.get("userId")?.value;
    const assistantId = req.nextUrl.searchParams.get("assistantId");
    const {toolName,publishValue} = await req.json();
    console.log("toolname ",toolName," publish value ",publishValue);

    if (!userIdStr || !assistantId) return NextResponse.json({ connected: false, tools: [] });

    let userId: ObjectId;
    try { userId = new ObjectId(userIdStr); } catch { return NextResponse.json({ connected: false, tools: [] }); }

    const db = (await clientPromise!).db();
    const data = await db.collection("google-calendar-oauth-consent").updateOne(
        {
            // --- Query to find the specific document ---
            userId, 
            assistantId,
            // --- Query to find the element within the array ---
            "tools.tool": toolName
        },
        {
            // --- Update operation using the positional $ operator ---
            $set: {
                "tools.$.publish": publishValue // depending on your need
            }
        }
    );
    console.log("update on publish assistant ",data);

    return NextResponse.json({ record : data});
}