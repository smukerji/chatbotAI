import { NextRequest, NextResponse } from "next/server";
import clientPromise from "../../../../../../db";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const chatbotId: string = params?.get("chatbotId")!;

  /// fetch the chatbot details
  const db = (await clientPromise!).db();
  const collection = db?.collection("user-chatbots");

  // get user ip
  const ip = request.headers.get("x-forwarded-for");

  // get user location based on its ip

  const location = await fetch(
    `https://ipinfo.io/${ip}/json?token=${process.env.NEXT_PUBLIC_LOCATION_TOKEN}`
  );
  const data2 = await location.json();
  const country = await data2?.country?.toLowerCase();

  const cursor = await collection.aggregate([
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
              leadFields: 1,
              leadTitle: 1,
              userDetails: 1,
              userMessageColor: 1,
              messagePlaceholder: 1,
              chatbotBubbleAlignment: 1,
              botType: 1,
            },
          },
        ],
      },
    },
  ]);

  const result = await cursor.toArray();

  /// close the cursor
  await cursor.close();

  return NextResponse.json({ ...result[0], country });
}
