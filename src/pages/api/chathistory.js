import clientPromise from "../../db";

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
    const initialMessageLength = body?.initialMessageLength;
    const historyCollectionName = body?.historyCollectionName;
    const email = body?.email;

    /// for storing the history date wise
    const startDate = sessionStartDate.split(" ")[0];

    /// db connection
    const db = (await clientPromise).db();

    /// get the collection to store chat history
    let collection = db.collection("chat-history");
    /// get the collection to store chat history
    if (historyCollectionName === "whatsapp") {
      collection = db.collection("whatsapp-chat-history");
    }

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

    /// update chat count for each chatbot
    await db.collection("user-chatbots").updateOne(
      { userId: userId, chatbotId: chatbotId },
      {
        $set: {
          lastUsed: new Date().getTime(),
        },
        $inc: {
          noOfMessagesSent: 1,
        },
      },
      {
        upsert: true,
      }
    );

    let user = undefined;
    if (historyCollectionName === "whatsapp") {
      /// check if the user already interacted with the chatbot
      user = await collection.findOne({
        userId,
        chatbotId,
        date: startDate,
      });
    } else {
      /// check if the user already interacted with the chatbot
      user = await collection.findOne({
        userId,
        chatbotId,
        date: startDate,
      });
    }

    try {
      if (!user) {
        /// if it return null store the history
        const insertedData = await collection.insertOne({
          userId,
          chatbotId,
          chats: {
            [sessionID]:
              historyCollectionName === "whatsapp"
                ? {
                    messages,
                    initialMessageLength: initialMessageLength,
                  }
                : {
                    messages,
                    sessionStartDate,
                    sessionEndDate,
                    initialMessageLength: initialMessageLength,
                    email: email,
                  },
          },
          date: startDate,
        });

        return res.status(200).send({
          message: "new history created",
          id: insertedData.insertedId,
        });
      } else {
        /// update the session
        await collection.updateOne(
          { userId, chatbotId, date: startDate },
          {
            $set: {
              chats:
                historyCollectionName === "whatsapp"
                  ? {
                      ...user?.chats,
                      [sessionID]: {
                        messages,
                        initialMessageLength: initialMessageLength,
                      },
                    }
                  : {
                      ...user?.chats,
                      [sessionID]: {
                        messages,
                        sessionStartDate,
                        sessionEndDate,
                        initialMessageLength: initialMessageLength,
                        email: email,
                      },
                    },
            },
          }
        );
        return res
          .status(200)
          .send({ message: "updated history", id: user._id });
      }
    } catch (err) {
      console.log("Error while updating chat history", err);
    }
  } else if (req.method === "GET") {
    /// get history for a specific session
    if (!req.query.chatbotId || !req.query.userId) {
      return res
        .status(400)
        .send({ error: "chatbotId and userId are required" });
    }
    const chatbotId = req.query.chatbotId;
    const sessionId = req.query.sessionId;
    const userId = req.query.userId;
    const historyCollectionName = req.query.historyCollectionName;
    const db = (await clientPromise).db();
    let collection = db.collection("chat-history");
    if (historyCollectionName === "whatsapp") {
      collection = db.collection("whatsapp-chat-history");
    }
    const history = await collection
      .find({ chatbotId: chatbotId, userId: userId })
      .toArray();

    /// from the object of chats get the specific session on the current date
    if (!history || history.length === 0) {
      return res.status(404).send({ error: "No chat history found" });
    }
    /// get the object of chats for according to the today date
    const todayDate = new Date().toISOString().split("T")[0].replace(/-/g, "/");

    const todayHistory = history.find(
      (item) => item.date === todayDate && item.chats[sessionId]
    );

    if (!todayHistory) {
      return res.status(404).send({ error: "No chat history found for today" });
    }
    /// get the session history
    const sessionHistory = todayHistory.chats[sessionId];
    return res.status(200).send(sessionHistory);
  }

  return res.status(405).send({ error: "Method not allowed" });
}
