import clientPromise  from "../../db";

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

    /// for storing the history date wise
    const startDate = sessionStartDate.split(" ")[0];

    /// db connection
    const db =  (await clientPromise!).db();

    /// get the collection to store chat history
    let collection = db.collection("chat-history");
    /// get the collection to store chat history
    if(historyCollectionName === "whatsapp"){
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
        date
      });
    }
    else {
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
        await collection.insertOne({
          userId,
          chatbotId,
          chats: {
            [sessionID]: historyCollectionName === "whatsapp" ? {
              messages,
              initialMessageLength: initialMessageLength,
            } 
            :
            {
              messages,
              sessionStartDate,
              sessionEndDate,
              initialMessageLength: initialMessageLength,
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
              chats: historyCollectionName === "whatsapp" ? {
                ...user?.chats,
                [sessionID]: {
                  messages,
                  initialMessageLength: initialMessageLength,
                },
              } 
              :
              {
                ...user?.chats,
                [sessionID]: {
                  messages,
                  sessionStartDate,
                  sessionEndDate,
                  initialMessageLength: initialMessageLength,
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
