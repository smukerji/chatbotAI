import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/db";
import { ObjectId } from "mongodb";

export async function GET(req: NextRequest) {
  const params: any = req.nextUrl.searchParams;

  try {
    const db = (await clientPromise!).db();
    const userCollection = db.collection("users");
    /// get the user and remove the password

    //does has any voicebot
    const voicebotCollection = db.collection("voice-assistance");
    const voiceBotCount = await voicebotCollection.countDocuments({
      userId:  new ObjectId(params.get("userId")),
    });

    const user = await userCollection.findOne(
      {
        _id: new ObjectId(params.get("userId")),
      },
      { projection: { password: 0 } }
    );

    return NextResponse.json({
      status: true,
      user: {...user,voiceBotCount},
    });
  } catch (error) {
    return NextResponse.json({
      status: false,
    });
  }
}
