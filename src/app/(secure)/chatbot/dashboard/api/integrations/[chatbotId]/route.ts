import clientPromise from "@/db";
import { NextRequest } from "next/server";

/// GET request to get all the integrations secrets
export async function GET(
  request: NextRequest,
  { params: { chatbotId } }: any
) {
  try {
    const db = (await clientPromise!).db();
    const integrationCollection = db.collection("user-chatbots");
    /// find one
    const data: any = await integrationCollection.findOne(
      {
        chatbotId: chatbotId,
      },
      {
        projection: {
          integrations: 1,
        },
      }
    );

    return new Response(JSON.stringify(data?.integrations), {
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.log("error in find integrations", error);
    return new Response(JSON.stringify({ error: error }), {
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}
