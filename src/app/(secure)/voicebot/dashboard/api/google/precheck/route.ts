import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "../../../../../../../db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const assistantId = searchParams.get("assistantId");

    if (!userId || !assistantId) {
      return NextResponse.json({ error: "Invalid Request, User and Assistant must be provided!" }, { status: 400 });
    }

    let objectUserId;
    try {
      objectUserId = new ObjectId(userId);
    } catch (e) {
      console.error("Invalid userId format:", userId, e);
      return NextResponse.json({ error: "Invalid userId format." }, { status: 400 });
    }

    const db = (await clientPromise!).db();

    // Find all connections for this user
    const userConnections = await db
      .collection("google-calendar-oauth-consent")
      .find({ userId: objectUserId })
      .toArray();

    for (const conn of userConnections) {
      // assistantId in DB is string, so compare as string
      if (
        conn.googleUserId &&
        conn.assistantId !== assistantId // only if not same assistant
      ) {
        let otherAssistant = null;
        try {
          // Try both as string and ObjectId for flexibility
          let assistantQuery = [
            { _id: conn.assistantId }, // string id
            { _id: new ObjectId(conn.assistantId) } // objectid, in case
          ];
          otherAssistant = await db.collection("voice-assistance").findOne({ $or: assistantQuery });
        } catch (err) {
          console.error("Error looking up otherAssistant:", conn.assistantId, err);
        }
        return NextResponse.json({
          alreadyConnectedToOther: true,
          googleEmail: conn.googleEmail || "",
          otherAssistantName: otherAssistant?.assistantName || "another voicebot"
        });
      }
    }

    return NextResponse.json({ alreadyConnectedToOther: false });
  } catch (error) {
    console.error("Precheck error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}