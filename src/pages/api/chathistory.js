import { connectDatabase } from "../../db";

export default async function handler(req, res) {
  if (req.method === "POST") {
    /// parse the request object
    const body = JSON.parse(req.body);
    const messages = body?.chatHistory;
    const chatbotId = body?.chatbotId;

    /// db connection
    const db = (await connectDatabase()).db();
    /// get the collection to store chat history
    let collection = db.collection("user-chatbots");

    await collection.updateOne(
      { chatbotId: chatbotId },
      { $set: { chatHistory: messages } },
      { upsert: true }
    );

    return res.status(200).send("saved history");
  }
}
