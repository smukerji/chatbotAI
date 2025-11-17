import { NextRequest, NextResponse } from "next/server";

import { ObjectId } from "mongodb";
import clientPromise from "@/db";


export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { evaluationDetails, assistantId } = body; // evaluationDetails: what your form returns, assistantId: MongoDB/your system's assistant _id

    // Call Vapi Create Eval API
    const vapiRes = await fetch("https://api.vapi.ai/eval", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.VAPI_PRIVATE_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(evaluationDetails)
    });
    const vapiData = await vapiRes.json();

    if (!vapiData?.id) {
      return NextResponse.json({ error: "Failed to create eval" }, { status: 500 });
    }

    // Update assistant's document in MongoDB: push eval ID
    const db = (await clientPromise!).db();
    const collection = db.collection("voice-assistance");
    const updateResult = await collection.updateOne(
      { _id: new ObjectId(assistantId) },
      { $push: { evalIds: vapiData.id } }
    );

    if (updateResult.modifiedCount !== 1) {
      return NextResponse.json({ error: "Failed to update assistant with eval ID" }, { status: 500 });
    }

    return NextResponse.json({ success: true, evalId: vapiData.id });
  } catch (error:any) {
    return NextResponse.json({ error: error?.message || String(error) }, { status: 500 });
  }
}
