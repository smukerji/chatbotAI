import { readContent } from "../../helper/ReadContent";
import { PineconeClient } from "@pinecone-database/pinecone";
import { generateChunksNEmbedd } from "../../helper/embeddings";
import { connectDatabase } from "../../db";
import { v4 as uuid } from "uuid";
import ChatbotName from "../../helper/ChatbotName";
import { upsert } from "../../helper/pinecone";

export default async function handler(req, res) {
  if (req.method === "POST") {
    /// parse the files object
    const body = JSON.parse(req.body);
    const files = body?.defaultFileList;
    const userId = body?.userId;
    const chatbotId = uuid();
    const chatbotName = "Chatbot " + ChatbotName();

    const fileData = files.map(async (file) => {
      return new Promise(async (resolve) => {
        /// read the file contents from the files object
        const content = await readContent(file.filepath, file.fileType);
        /// generating chuncks and embedding
        const chunks = await generateChunksNEmbedd(
          content,
          file.name,
          chatbotId
        );
        resolve(chunks);
      });
    });

    const valuesPromise = await Promise.all(fileData);
    /// get the filenames and vectors created ID
    const fileSource = valuesPromise.map((values) => {
      return {
        name: values.data[0]?.metadata?.filename,
        dataID: values?.dataIDs,
      };
    });

    const values = [].concat(...valuesPromise);

    /// store the emebeddings in pinecone database
    let upserData = values.map((value) => {
      return value.data;
    });
    upserData = [].concat(...upserData);
    await upsert(upserData, userId);

    /// store the details in database
    const db = await connectDatabase();
    const collection = db.collection("user-details");
    /// iterate and store each user filename as per chatbot
    fileSource.forEach((file) => {
      collection.insertOne({
        userId,
        chatbotId,
        chatbotName,
        fileName: file.name,
        dataID: file.dataID,
      });
    });
    return res.status(200).send("Chabot trained successfully");
  }
}
