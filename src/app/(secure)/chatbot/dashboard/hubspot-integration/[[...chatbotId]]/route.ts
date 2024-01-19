import { NextResponse, NextRequest } from "next/server";
import { connectDatabase } from "../../../../../../db";
import { apiHandler } from "../../../../../_helpers/server/api/api-handler";

module.exports = apiHandler({
  POST: submitAccessToken,
  GET: getAccessToken,
});

async function submitAccessToken(request: any) {
  const { chatbotId, hubspotAccessToken } = await request.json();

  console.log("hubspotAccessToken", hubspotAccessToken);

  /// fetch the data sources of the chabot
  const db = (await connectDatabase())?.db();
  const collection = db?.collection("user-chatbots");
  const chatbot = await collection?.findOne({ chatbotId: chatbotId });

  if (chatbot?.chatbotId) {
    const updatedChatbot = await collection?.updateOne(
      { chatbotId: chatbotId },
      { $set: { hubspotAccessToken } }
    );

    return { message: "token saved" };
  }
  return { message: "not saved" };
}

async function getAccessToken(
  request: NextRequest,
  { params }: { params: { chatbotId: string } }
) {
  console.log("chatbotId", params.chatbotId[0]);

  /// fetch the data sources of the chabot
  const db = (await connectDatabase())?.db();
  const collection = db?.collection("user-chatbots");
  const chatbot = await collection?.findOne({ chatbotId: params.chatbotId[0] });

  if (chatbot?.hubspotAccessToken) {
    return { hubspotAccessToken: chatbot?.hubspotAccessToken };
  }
  return { message: "not found" };
}
