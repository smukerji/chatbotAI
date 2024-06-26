import { NextResponse, NextRequest } from "next/server";
import clientPromise from "../../../../../db";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const chatbotId: string = params?.get("chatbotId")!;

  /// fetch the chatbot details
  const db = (await clientPromise!).db();
  // console.log("Database ", db);

  const collection = db?.collection("user-chatbots");

  const botDetails = await collection.findOne({
    chatbotId: chatbotId,
  });

  return NextResponse.json(botDetails);
}
