import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "../../../../../../db";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const chatbotId: string = params?.get("chatbotId")!;

  /// fetch the chatbot details
  const db = (await connectDatabase())?.db();
  const collection = db?.collection("user-chatbots");

  const result = await collection
    .aggregate([
      {
        $match: { chatbotId: chatbotId },
      },
      {
        $lookup: {
          from: "chatbot-settings",
          localField: "chatbotId",
          foreignField: "chatbotId",
          as: "chatbotSettings",
          /// this will only include the field needed from chatbot settings
          pipeline: [
            {
              $project: {
                _id: 0,
                suggestedMessages: 1,
                initialMessage: 1,
                userId: 1,
                chatbotName: 1,
                chatbotDisplayName: 1,
                chatbotIconColor: 1,
                bubbleIconUrl: 1,
                profilePictureUrl: 1,
              },
            },
          ],
        },
      },
    ])
    .toArray();

  return NextResponse.json(result[0]);
}
