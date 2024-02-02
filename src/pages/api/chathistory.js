import { connectDatabase } from "../../db";

export default async function handler(req, res) {
  if (req.method === "POST") {
    /// parse the request object
    const body = JSON.parse(req.body);
    const messages = body?.messages;
    const chatbotId = body?.chatbotId;
    const userId = body?.userId;
    const sessionID = body?.sessionID;
    const sessionStartDate = body?.sessionStartDate;
    const sessionEndDate = body?.sessionEndDate;

    /// for storing the history date wise
    const startDate = sessionStartDate.split(" ")[0];

    /// db connection
    const db = (await connectDatabase()).db();

    /// get the collection to store chat history
    let collection = db.collection("chat-history");

    /// update the chat count
    const updateBotCount = await db.collection("user-details").updateOne(
      { userId: userId },
      {
        $set: {
          userId: userId,
        },
        $inc: {
          totalMessageCount: 1,
        },
      },
      {
        upsert: true,
      }
    );

    /// check if the user already interacted with the chatbot
    const user = await collection.findOne({
      userId,
      chatbotId,
      date: startDate,
    });

    try {
      if (!user) {
        /// if it return null store the history
        await collection.insertOne({
          userId,
          chatbotId,
          chats: {
            [sessionID]: {
              messages,
              sessionStartDate,
              sessionEndDate,
            },
          },
          date: startDate,
        });
      } else {
        /// update the session
        await collection.updateOne(
          { userId, chatbotId, date: startDate },
          {
            $set: {
              chats: {
                ...user?.chats,
                [sessionID]: {
                  messages,
                  sessionStartDate,
                  sessionEndDate,
                },
              },
            },
          }
        );
      }
      return res.status(200).send("saved history");
    } catch (err) {
      console.log("Error while updating chat history", err);
    }
  }
}
