import { Pinecone } from "@pinecone-database/pinecone";

import { createEmbedding } from "../../app/_helpers/server/embeddings";
import clientPromise  from "../../db";
import { deletevectors } from "../../app/_helpers/server/pinecone";

export default async function handler(req, res) {
  if (req.method === "POST") {
    // console.log("fd");
    // await pinecone.init({
    //   environment: process.env.NEXT_PUBLIC_PINECONE_ENV,
    //   apiKey: process.env.NEXT_PUBLIC_PINECONE_KEY,
    // });
    // const index = pinecone.Index(process.env.NEXT_PUBLIC_PINECONE_INDEX);
    // const tr = await index.delete1({
    //   deleteAll: true,
    //   namespace: undefined,
    // });
    // return res.status(200).send(tr);
    /// parse the request object
    const body = JSON.parse(req.body);
    const userQuery = body?.userQuery;
    const chatbotId = body?.chatbotId;
    const userId = body?.userId;

    /// create the embedding of user query
    const embed = await createEmbedding(userQuery);

    /// set the params of pinecone embeddings retrival
    const queryRequest = {
      vector: embed,
      topK: 5,
      includeMetadata: true,
      filter: {
        chatbotId: chatbotId,
      },
    };

    try {
      const pinecone = new Pinecone({
        apiKey: process.env.NEXT_PUBLIC_PINECONE_KEY,
      });
      const index = pinecone.index(process.env.NEXT_PUBLIC_PINECONE_INDEX);

      try {
        /// query embeddings
        const ns = index.namespace(userId);
        const response = await ns.query(queryRequest);
        /// extract the content
        const extractedContents = response?.matches?.map(
          (item) => item.metadata["content"]
        );
        return res.status(200).send(extractedContents);
      } catch (error) {
        console.error("Error during queryfetch:", error);
        return res.status(200).send(error.message);
      }
    } catch (error) {
      console.error("Error initializing Pinecone client:", error);
      throw new Error(
        "Failed to initialize Pinecone client while retriving the similarity results"
      );
    }
  } else {
    /// deleting the chatbot data from pinecone
    /// parse the request object
    const body = JSON.parse(req.body);
    const chatbotId = body?.chatbotId;
    const userId = body?.userId;

    /// fetch the IDs and user namespace from the DB
    const db =  (await clientPromise).db();
    const collection = db.collection("chatbots-data");
    const userChatbots = db.collection("user-chatbots");
    const userChatbotSettings = db.collection("chatbot-settings");
    const cursor = collection.find({ chatbotId: chatbotId });

    let vectorId = [];
    let namespace = "";
    for await (const doc of cursor) {
      /// get the vector id's of website crawling list
      if (Array.isArray(doc.content)) {
        doc.content.forEach((content) => {
          vectorId.push(content.dataID);
        });
      } else {
        vectorId.push(doc.dataID);
      }
      namespace = userId;
    }

    /// close the cursor
    await cursor.close();

    vectorId = [].concat(...vectorId);
    /// delete the vectors
    const deleteData = await collection.deleteMany({ chatbotId: chatbotId });
    /// delete the chatbot
    await userChatbots.deleteOne({ chatbotId: chatbotId });
    /// delete chatbot settings
    await userChatbotSettings.deleteOne({ chatbotId: chatbotId });

    //delete the whatsapp details collection record against chatbotId
    const whatsappDetails = db.collection("whatsappbot_details");//whatsappbot_details
    await whatsappDetails.deleteOne({ chatbotId: chatbotId });

    //delete the telegram details collection's record against chatbotId
    const telegramDetails = db.collection("telegram-bot");//whatsappbot_details
    await telegramDetails.deleteOne({ chatbotId: chatbotId });

    /// deleting the chunks to avoid  Request Header Fields Too Large error
    const deleteBatchSize = 250;
    for (let i = 0; i <= vectorId.length; i += deleteBatchSize) {
      const deleteBatch = vectorId.slice(i, i + deleteBatchSize);
      deletevectors(deleteBatch, namespace);
    }
    return res.status(200).send({ text: "Deleted successfully" });
  }
}
