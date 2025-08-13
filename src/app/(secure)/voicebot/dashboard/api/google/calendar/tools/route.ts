
// import { NextRequest, NextResponse } from "next/server";
// import { cookies } from "next/headers";
// import { ObjectId } from "mongodb";
// import clientPromise from "@/db";

// export async function PUT(req: NextRequest) {
//     const cookieStore = cookies();
//     const userIdStr = cookieStore.get("userId")?.value;
//     const assistantId = req.nextUrl.searchParams.get("assistantId");
//     const { toolName } = await req.json();

//     if (!userIdStr || !assistantId) {
//         return NextResponse.json({ result: false, message: "Missing user/assistant", tools: [] });
//     }

//     let userId: ObjectId;
//     try {
//         userId = new ObjectId(userIdStr);
//     } catch {
//         return NextResponse.json({ result: false, message: "Invalid userId", tools: [] });
//     }

//     const db = (await clientPromise!).db();

//     // Get current doc
//     const doc = await db.collection("google-calendar-oauth-consent").findOne({ userId, assistantId });

//     if (!doc || !doc.tools || doc.tools.length === 0) {
//         // Nothing to disconnect
//         return NextResponse.json({ result: true, message: "No entry to remove.", tools: [] });
//     }

//     // Count published tools
//     const publishedTools = doc.tools.filter((t: { tool: string; publish: boolean }) => t.publish);

//     // CASE 1: Only one tool published, disconnect = remove whole doc
//     if (publishedTools.length === 1 && publishedTools[0].tool === toolName) {
//         await db.collection("google-calendar-oauth-consent").deleteOne({ userId, assistantId });
//         return NextResponse.json({ result: true, message: "Last tool disconnected, entry removed.", tools: [] });
//     }

//     // CASE 2: More than one tool published, disconnect = set publish:false for this tool
//     await db.collection("google-calendar-oauth-consent").updateOne(
//         { userId, assistantId, "tools.tool": toolName },
//         { $set: { "tools.$.publish": false } }
//     );
//     // Check if any published tools remain
//     const updatedDoc = await db.collection("google-calendar-oauth-consent").findOne({ userId, assistantId });
//     const stillPublished = updatedDoc?.tools?.filter((t: { tool: string; publish: boolean }) => t.publish) ?? [];
//     if (stillPublished.length === 0) {
//         await db.collection("google-calendar-oauth-consent").deleteOne({ userId, assistantId });
//         return NextResponse.json({ result: true, message: "All tools disconnected, entry removed.", tools: [] });
//     }
//     return NextResponse.json({ result: true, message: "Tool disconnected.", tools: updatedDoc?.tools || [] });
// }




import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ObjectId } from "mongodb";
import clientPromise from "@/db";

export async function PUT(req: NextRequest) {
    const cookieStore = cookies();
    const userIdStr = cookieStore.get("userId")?.value;
    const assistantId = req.nextUrl.searchParams.get("assistantId");
    const { toolName, publishValue } = await req.json();

    if (!userIdStr || !assistantId) {
        return NextResponse.json({ result: false, message: "Missing user/assistant", tools: [] });
    }

    let userId: ObjectId;
    try {
        userId = new ObjectId(userIdStr);
    } catch {
        return NextResponse.json({ result: false, message: "Invalid userId", tools: [] });
    }

    const db = (await clientPromise!).db();

    // Get current doc
    const doc = await db.collection("google-calendar-oauth-consent").findOne({ userId, assistantId });

    if (!doc || !doc.tools || doc.tools.length === 0) {
        return NextResponse.json({ result: true, message: "No entry to update.", tools: [] });
    }

    // If publishValue === true, set publish: true for the tool if it exists
    if (publishValue === true) {
        // If tool exists, just set publish: true
        const toolExists = doc.tools.some((t: { tool: string }) => t.tool === toolName);
        if (toolExists) {
            await db.collection("google-calendar-oauth-consent").updateOne(
                { userId, assistantId, "tools.tool": toolName },
                { $set: { "tools.$.publish": true } }
            );
            const updatedDoc = await db.collection("google-calendar-oauth-consent").findOne({ userId, assistantId });
            return NextResponse.json({ result: true, message: "Tool reconnected.", tools: updatedDoc?.tools || [] });
        } else {
            // If another tool is already published, add this tool with publish: true
            const anotherPublished = doc.tools.some((t: { publish: boolean }) => t.publish);
            if (anotherPublished) {
                await db.collection("google-calendar-oauth-consent").updateOne(
                    { userId, assistantId },
                    { $addToSet: { tools: { tool: toolName, publish: true } } }
                );
                const updatedDoc = await db.collection("google-calendar-oauth-consent").findOne({ userId, assistantId });
                return NextResponse.json({ result: true, message: "Tool added and connected.", tools: updatedDoc?.tools || [] });
            } else {
                // If no other tool is published, UI should open consent window (don't do anything here)
                return NextResponse.json({ result: false, message: "Consent required for new tool.", tools: doc.tools });
            }
        }
    }

    // If publishValue === false, disconnect logic (no change needed)
    const publishedTools = doc.tools.filter((t: { tool: string; publish: boolean }) => t.publish);

    // CASE 1: Only one tool published, disconnect = remove whole doc
    if (publishedTools.length === 1 && publishedTools[0].tool === toolName) {
        await db.collection("google-calendar-oauth-consent").deleteOne({ userId, assistantId });
        return NextResponse.json({ result: true, message: "Last tool disconnected, entry removed.", tools: [] });
    }

    // CASE 2: More than one tool published, disconnect = set publish:false for this tool
    await db.collection("google-calendar-oauth-consent").updateOne(
        { userId, assistantId, "tools.tool": toolName },
        { $set: { "tools.$.publish": false } }
    );
    const updatedDoc = await db.collection("google-calendar-oauth-consent").findOne({ userId, assistantId });
    const stillPublished = updatedDoc?.tools?.filter((t: { tool: string; publish: boolean }) => t.publish) ?? [];
    if (stillPublished.length === 0) {
        await db.collection("google-calendar-oauth-consent").deleteOne({ userId, assistantId });
        return NextResponse.json({ result: true, message: "All tools disconnected, entry removed.", tools: [] });
    }
    return NextResponse.json({ result: true, message: "Tool disconnected.", tools: updatedDoc?.tools || [] });
}