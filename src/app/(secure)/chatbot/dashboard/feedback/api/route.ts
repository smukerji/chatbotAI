import clientPromise from "../../../../../../db";
import { apiHandler } from "../../../../../_helpers/server/api/api-handler";

module.exports = apiHandler({
  POST: feedBack,
});

async function feedBack(request: any) {
  const { chatbotId, messages, feedback } = await request.json();

  /// fetch the data sources of the chabot
  const db = (await clientPromise!).db();
  const collection = db?.collection("chatbots-feebback-data");
  /// store the feedback response
  await collection.insertOne({ chatbotId, messages, feedback });
  return { message: "Thank you for your valuable feedback!" };
}
