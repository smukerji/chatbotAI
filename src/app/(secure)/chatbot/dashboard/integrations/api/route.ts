import { NextResponse, NextRequest } from "next/server";
import { connectDatabase } from "../../../../../../db";
import { apiHandler } from "../../../../../_helpers/server/api/api-handler";
import axios from "axios";
import { getServerSession } from "next-auth";

module.exports = apiHandler({
  POST: chatbotInfo,
});

async function chatbotInfo(request: NextRequest) {
  const data = await request.json();
  /// fetch the data sources of the chabot
  const db = (await connectDatabase())?.db();
  const collection = db?.collection("hubspotxchatbot");
  await collection.updateOne(
    { chatbotId: data?.chatbotId },
    { $set: { ...data } },
    { upsert: true }
  );
  return {
    message: "success",
  };
}

export default async function authHandler(request: NextRequest) {}
