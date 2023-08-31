import { readContent } from "../../helper/ReadContent";
import { generateChunksNEmbedd } from "../../helper/embeddings";
import { connectDatabase } from "../../db";
import { v4 as uuid } from "uuid";
import ChatbotName from "../../helper/ChatbotName";
import { deleteFileVectorsById, upsert } from "../../helper/pinecone";
import { ObjectId } from "mongodb";

export default async function handler(req, res) {
  if (req.method === "POST") {
    /// parse the files object
    const body = JSON.parse(req.body);
    const files = body?.defaultFileList;
    const userId = body?.userId;
    const chatbotId = body?.chatbotId ? body?.chatbotId : uuid();
    const chatbotName = "Chatbot " + ChatbotName();
    const qaList = body?.qaList;
    const text = body?.text;

    /// using this variable to check if the chatbot needs to be retrained and has updated QA and Text source
    const updateChatbot = body?.updateChatbot;
    /// deleting the file list
    const deleteFileList = body?.deleteFileList;
    /// deleting the QA list
    const deleteQAList = body?.deleteQAList;
    // return res.status(200).send({ deleteQAList });

    /// db connection
    const db = await connectDatabase();
    const collection = db.collection("user-details");

    /// deleting files that needs to be deleted
    if (deleteFileList.length > 0) {
      /// delete all the files from DB
      deleteFileList.forEach(async (file) => {
        /// get the file id
        const objectId = new ObjectId(file.id);
        /// fetch the file to get the data IDs of vector stores
        const dbFile = await collection.findOne({
          _id: objectId,
        });
        /// deleting the files by id
        await deleteFileVectorsById(userId, dbFile?.dataID);
        /// delete the id from db
        await collection.deleteOne({
          _id: objectId,
        });
      });
    }

    /// deleting QA that needs to be deleted
    if (deleteQAList.length > 0) {
      /// delete all the QA from DB
      deleteQAList.forEach(async (qa) => {
        /// get the QA id
        const objectId = new ObjectId(qa.id);
        /// fetch the QA to get the data IDs of vector stores
        const dbQA = await collection.findOne({
          _id: objectId,
        });
        /// deleting the qa by id
        await deleteFileVectorsById(userId, dbQA?.dataID);
        /// delete the id from db
        await collection.deleteOne({
          _id: objectId,
        });
      });
    }

    // return res
    //   .status(200)
    //   .send({ updateChatbot, updatedQASource, updatedTextSource });

    /// prcessing the file data
    if (files.length > 0) {
      const fileData = files.map(async (file) => {
        return new Promise(async (resolve, reject) => {
          if (file?.filepath) {
            /// read the file contents from the files object
            const content = await readContent(file.filepath, file.fileType);
            /// generating chunks and embedding
            const chunks = await generateChunksNEmbedd(
              content,
              "file",
              chatbotId,
              file.name
            );
            resolve(chunks);
          } else {
            reject();
          }
        });
      });

      const valuesPromiseContainer = await Promise.allSettled(fileData);
      /// filter only the resolved promises
      const valuesPromise = valuesPromiseContainer.filter(
        (result) => result.status === "fulfilled"
      );
      /// get the filenames and vectors created ID
      const fileSource = valuesPromise.map((values) => {
        if (values != undefined)
          return {
            name: values?.value.data[0]?.metadata?.filename,
            dataID: values?.value?.dataIDs,
            contentLength: values?.value?.contentLength,
          };
      });

      const values = [].concat(...valuesPromise);

      /// store the emebeddings in pinecone database
      let upserData = values.map((value) => {
        return value?.value?.data;
      });
      upserData = [].concat(...upserData);
      if (upserData.length > 0) await upsert(upserData, userId);

      /// store the details in database
      /// iterate and store each user filename as per chatbot
      fileSource.forEach((file) => {
        collection.insertOne({
          userId,
          chatbotId,
          chatbotName,
          fileName: file.name,
          dataID: file.dataID,
          contentLength: file.contentLength,
          source: "file",
        });
      });
    }

    /// prcessing the text data
    if (text.length > 0) {
      /// if text has been updated then delete the old data from pinecone and mongo db
      if (updateChatbot) {
        /// fetch the file to get the data IDs of vector stores
        const dbText = await collection.findOne({
          userId: userId,
          chatbotId: chatbotId,
          source: "text",
        });
        /// deleting the files by id
        await deleteFileVectorsById(userId, dbText?.dataID);
        /// delete the id from db
        await collection.deleteOne({
          userId: userId,
          chatbotId: chatbotId,
          source: "text",
        });
      }
      /// generating chunks and embedding
      const chunks = await generateChunksNEmbedd(text, "text", chatbotId);

      /// store the emebeddings in pinecone database
      await upsert(chunks.data, userId);

      /// store the details in database
      /// iterate and store each user filename as per chatbot
      collection.insertOne({
        userId,
        chatbotId,
        chatbotName,
        dataID: chunks.dataIDs,
        content: text,
        source: "text",
      });
    }

    /// prcessing the text data
    if (qaList.length > 0) {
      /// store the index so that it is easy to map the QA while storing in db
      const qaListEmbbedingIndex = [];
      /// generating chunks and embedding
      const qaData = qaList.map(async (qa, index) => {
        return new Promise(async (resolve, reject) => {
          /// if qa has id then it need to be deleted and then inserted
          if (qa?.id && qa?.updated) {
            /// get the QA id
            const objectId = new ObjectId(qa.id);
            /// fetch the QA to get the data IDs of vector stores
            const dbQA = await collection.findOne({
              _id: objectId,
            });
            /// deleting the qa by id
            await deleteFileVectorsById(userId, dbQA?.dataID);
            /// delete the id from db
            await collection.deleteOne({
              _id: objectId,
            });

            /// generating chunks and embedding
            const chunks = await generateChunksNEmbedd(
              JSON.stringify({ question: qa.question, answer: qa.answer }),
              "qa",
              chatbotId
            );
            qaListEmbbedingIndex.push(index);
            resolve(chunks);
          } else if (qa?.id == undefined) {
            /// generating chunks and embedding
            const chunks = await generateChunksNEmbedd(
              JSON.stringify(qa),
              "qa",
              chatbotId
            );
            qaListEmbbedingIndex.push(index);
            resolve(chunks);
          } else {
            reject();
          }
        });
      });

      const valuesPromiseContainer = await Promise.allSettled(qaData);
      /// filter only the resolved promises
      const valuesPromise = valuesPromiseContainer.filter(
        (result) => result.status === "fulfilled"
      );
      /// get the vectors created ID
      const qaSource = valuesPromise.map((values) => {
        return {
          dataID: values?.value?.dataIDs,
        };
      });

      const values = [].concat(...valuesPromise);

      /// store the emebeddings in pinecone database
      let upserData = values.map((value) => {
        return value?.value?.data;
      });
      upserData = [].concat(...upserData);
      if (upserData.length > 0) await upsert(upserData, userId);

      /// store the details in database
      /// iterate and store each user filename as per chatbot
      qaSource.forEach((qa, index) => {
        collection.insertOne({
          userId,
          chatbotId,
          chatbotName,
          dataID: qa.dataID,
          content: qaList[qaListEmbbedingIndex[index]]?.id
            ? {
                question: qaList[qaListEmbbedingIndex[index]]?.question,
                answer: qaList[qaListEmbbedingIndex[index]]?.answer,
              }
            : qaList[qaListEmbbedingIndex[index]],
          source: "qa",
        });
      });
    }
    /// send the response
    const responseCode = updateChatbot ? 201 : 200;
    const responseText = updateChatbot
      ? "Chatbot re-trained successfully"
      : "Chabot trained successfully";
    return res.status(responseCode).send(responseText);
  }
}
