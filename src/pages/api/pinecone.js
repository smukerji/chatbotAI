import { PineconeClient } from "@pinecone-database/pinecone";

import { createEmbedding } from "../../app/_helpers/server/embeddings";
import { connectDatabase } from "../../db";
import { deletevectors } from "../../app/_helpers/server/pinecone";

export const pinecone = new PineconeClient();

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
    //   namespace: "651d111b8158397ebd0e65fb",
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
      includeValues: false,
      includeMetadata: true,
      filter: {
        chatbotId: chatbotId,
      },
      namespace: userId,
    };

    try {
      try {
        await pinecone.init({
          environment: process.env.NEXT_PUBLIC_PINECONE_ENV,
          apiKey: process.env.NEXT_PUBLIC_PINECONE_KEY,
        });
      } catch (error) {
        console.error("Error initializing Pinecone client:", error);
        throw new Error("Failed to initialize Pinecone client");
      }

      const index = pinecone.Index(process.env.NEXT_PUBLIC_PINECONE_INDEX);

      /// query embeddings
      const response = await index.query({ queryRequest });
      /// extract the content
      const extractedContents = response?.matches?.map(
        (item) => item.metadata["content"]
      );
      return res.status(200).send(extractedContents);
    } catch (error) {
      console.error("Error during queryfetch:", error);
      return res.status(200).send(error.message);
    }
  } else {
    /// deleting the chatbot data from pinecone
    /// parse the request object
    const body = JSON.parse(req.body);
    const chatbotId = body?.chatbotId;
    const userId = body?.userId;

    /// fetch the IDs and user namespace from the DB
    const db = (await connectDatabase()).db();
    const collection = db.collection("chatbots-data");
    const userChatbots = db.collection("user-chatbots");
    const cursor = collection.find({ chatbotId: chatbotId });

    let vectorId = [];
    let namespace = "";
    for await (const doc of cursor) {
      /// get the vector id's of website crawling list
      if (Array.isArray(doc.content)) {
        doc.content.forEach((content) => {
          vectorId.push(content.dataID);
        });
      }
      vectorId.push(doc.dataID);
      namespace = userId;
    }
    vectorId = [].concat(...vectorId);
    /// delete the vectors
    const deleteData = await collection.deleteMany({ chatbotId: chatbotId });
    /// delete the chatbot
    await userChatbots.deleteOne({ chatbotId: chatbotId });

    /// deleting the chunks to avoid  Request Header Fields Too Large error
    const deleteBatchSize = 250;
    for (let i = 0; i <= vectorId.length; i += deleteBatchSize) {
      const deleteBatch = vectorId.slice(i, i + deleteBatchSize);
      deletevectors(deleteBatch, namespace);
    }
    return res.status(200).send({ text: "Deleted successfully" });
  }
}
