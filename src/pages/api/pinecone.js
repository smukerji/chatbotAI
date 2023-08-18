import { readContent } from "../../helper/ReadContent";
import { PineconeClient } from "@pinecone-database/pinecone";

import {
  createEmbedding,
  generateChunksNEmbedd,
} from "../../helper/embeddings";
import { connectDatabase } from "../../db";
import { v4 as uuid } from "uuid";
import ChatbotName from "../../helper/ChatbotName";
import { upsert } from "../../helper/pinecone";

export const pinecone = new PineconeClient();
try {
  // pinecone.init({
  //   environment: process.env.NEXT_PUBLIC_PINECONE_ENV,
  //   apiKey: process.env.NEXT_PUBLIC_PINECONE_KEY,
  // });
} catch (error) {
  console.error("Error initializing Pinecone client:", error);
  throw new Error("Failed to initialize Pinecone client");
}

export default async function handler(req, res) {
  if (req.method === "POST") {
    /// parse the files object
    const body = JSON.parse(req.body);
    const userQuery = body?.userQuery;
    // const embedding = createEmbedding(userQuery);
    // const pinecone = new PineconeClient({
    //   apiKey: process.env.NEXT_PUBLIC_PINECONE_KEY,
    //   baseUrl:
    //     "https://sapahk-chatbot-2e36a9f.svc.asia-southeast1-gcp-free.pinecone.io",
    //   namespace: process.env.NEXT_PUBLIC_PINECONE_INDEX,
    // });

    // const result = await pinecone.query({
    //   vector: embedding,
    //   topK: 1,
    // });
    // console.log(userQuery);

    /// create the query embedding
    const embed = await createEmbedding(userQuery);
    const queryRequest = {
      vector: embed,
      topK: 10,
      includeValues: false,
      includeMetadata: true,
      // filter: {
      //   chatbotId: chatbotId,
      // },
      // namespace: userId,
    };

    try {
      const index = pinecone.Index(process.env.NEXT_PUBLIC_PINECONE_INDEX);

      const response = await index.query({ queryRequest });
      console.log("Respinse", response);
      const extractedContents = response?.matches?.map(
        (item) => item.metadata["content"]
      );
      console.log(extractedContents);
      return extractedContents;
    } catch (error) {
      console.error("Error during queryfetch:", error);
      return { error: error.message };
    }
    // console.log(result?.matches);

    return res.status(200).send("result?.matches");
  }
}
