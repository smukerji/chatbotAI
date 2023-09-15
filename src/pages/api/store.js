import { readContent } from "../../app/_helpers/server/ReadContent";
import { generateChunksNEmbedd } from "../../app/_helpers/server/embeddings";
import { connectDatabase } from "../../db";
import { v4 as uuid } from "uuid";

import {
  deleteFileVectorsById,
  updateVectorsById,
  upsert,
} from "../../app/_helpers/server/pinecone";
import { ObjectId } from "mongodb";
import mv from "mv";
const formidable = require("formidable");

export default async function handler(req, res) {
  if (req.method === "POST") {
    const form = new formidable.IncomingForm();
    form.parse(req, async (err, fields, QAfiles) => {
      if (err) {
        console.error(err);
        res.status(500).send("Error parsing formdata");
        return;
      }
      // const qaImage = QAfiles?.qaImage ? QAfiles?.qaImage[0] : null;
      // console.log(JSON.parse(fields?.qaList));
      // return;
      const files = JSON.parse(fields?.defaultFileList);
      const userId = fields?.userId[0];
      const chatbotId =
        fields?.chatbotId[0] !== "undefined" ? fields?.chatbotId[0] : uuid();
      const qaList = JSON.parse(fields?.qaList);
      const text = fields?.text[0];
      // return;
      // console.log(chatbotId);
      // return;

      /// using this variable to check if the chatbot needs to be retrained and has updated QA and Text source
      const updateChatbot = JSON.parse(fields?.updateChatbot[0]);
      /// deleting the file list
      const deleteFileList = JSON.parse(fields?.deleteFileList[0]);
      /// deleting the QA list
      const deleteQAList = JSON.parse(fields?.deleteQAList[0]);

      /// genrating the qa list
      for (let i = 0; i < qaList.length; i++) {
        // console.log(QAfiles[`qaList[${i}].image`], i);
        // Check if an image file is present for this Q&A pair
        const imageFile = QAfiles[`qaList[${i}].image`];

        qaList[i].image = imageFile
          ? uuid() + "-" + imageFile[0].originalFilename
          : qaList[i].image == ""
          ? null
          : qaList[i].image; // Use the file path or null if no image

        /// store the images files in server
        if (imageFile) {
          /// store the images
          var oldPath = imageFile[0].filepath;
          var newPath = `./public/qa-images/${qaList[i].image}`;
          /// move the file from tmp to server
          mv(oldPath, newPath, function (err) {
            console.log("Error storing file", err);
          });
        }

        // qaList.push(qaItem);
      }
      // console.log("QAlist", qaList);
      // const responseCode = updateChatbot ? 200 : 200;
      // const responseText = updateChatbot
      //   ? "Chatbot re-trained successfully"
      //   : "Chabot trained successfully";
      // return res.status(responseCode).send(responseText);

      // console.log(qaList);

      /// db connection
      const db = (await connectDatabase()).db();
      /// if new chatbot is being created the new chatbot entry
      let collection = db.collection("chatbots-data");
      if (!updateChatbot) {
        const chatbotName = fields?.chatbotText[0];
        let userChatbotsCollection = db.collection("user-chatbots");
        userChatbotsCollection.insertOne({
          userId,
          chatbotId,
          chatbotName,
        });
      }

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

      // // return res
      // //   .status(200)
      // //   .send({ updateChatbot, updatedQASource, updatedTextSource });

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
            chatbotId,
            fileName: file.name,
            dataID: file.dataID,
            contentLength: file.contentLength,
            source: "file",
          });
        });
        //   }
      }

      /// prcessing the text data
      if (text.length > 0) {
        /// if text has been updated then delete the old data from pinecone and mongo db
        if (updateChatbot) {
          /// fetch the file to get the data IDs of vector stores
          const dbText = await collection.findOne({
            chatbotId: chatbotId,
            source: "text",
          });
          if (dbText != null) {
            /// deleting the files by id
            await deleteFileVectorsById(userId, dbText?.dataID);
            /// delete the id from db
            await collection.deleteOne({
              chatbotId: chatbotId,
              source: "text",
            });
          }
        }
        /// generating chunks and embedding
        const chunks = await generateChunksNEmbedd(text, "text", chatbotId);

        /// store the emebeddings in pinecone database
        await upsert(chunks.data, userId);

        /// store the details in database
        /// iterate and store each user filename as per chatbot
        collection.insertOne({
          chatbotId,
          dataID: chunks.dataIDs,
          content: text,
          source: "text",
        });
      }

      /// prcessing the QA data
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
              /// generating chunks and embedding
              const chunks = await generateChunksNEmbedd(
                JSON.stringify({
                  question: qa.question,
                  answer: qa.answer,
                  filename: qa.image,
                }),
                "qa",
                chatbotId
              );

              chunks.data[0].id = dbQA?.dataID[0];

              /// update the vectors in pinecone
              await updateVectorsById(chunks.data, userId);
              /// update the vectors in database
              await collection.updateOne(
                { _id: objectId },
                {
                  $set: {
                    content: {
                      question: qa.question,
                      answer: qa.answer,
                      image: qa.image,
                    },
                  },
                }
              );
              reject();
            } else if (qa?.id == undefined) {
              /// generating chunks and embedding
              const chunks = await generateChunksNEmbedd(
                JSON.stringify({
                  question: qa.question,
                  answer: qa.answer,
                  filename: qa.image,
                }),
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
        console.log(upserData);
        if (upserData.length > 0) await upsert(upserData, userId);
        /// store the details in database
        /// iterate and store each user qa as per chatbot
        qaSource.forEach((qa, index) => {
          collection.insertOne({
            chatbotId,
            dataID: qa.dataID,
            content: qaList[qaListEmbbedingIndex[index]]?.id
              ? {
                  question: qaList[qaListEmbbedingIndex[index]]?.question,
                  answer: qaList[qaListEmbbedingIndex[index]]?.answer,
                  image: qaList[qaListEmbbedingIndex[index]]?.image,
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
    });
  } else {
    res.status(405).send("Method not allowed");
  }

  // if (req.method === "POST") {
  //   /// parse the files object
  //   const body = JSON.parse(req.body);
  //   const files = body?.defaultFileList;
  //   const userId = body?.userId;
  //   const chatbotId = body?.chatbotId ? body?.chatbotId : uuid();
  //   const qaList = body?.qaList;
  //   const text = body?.text;

  //   /// using this variable to check if the chatbot needs to be retrained and has updated QA and Text source
  //   const updateChatbot = body?.updateChatbot;
  //   /// deleting the file list
  //   const deleteFileList = body?.deleteFileList;
  //   /// deleting the QA list
  //   const deleteQAList = body?.deleteQAList;
  //   // return res.status(200).send({ deleteQAList });

  //   /// db connection
  //   const db = await connectDatabase().db();
  //   /// if new chatbot is being created the new chatbot entry
  //   let collection = db.collection("chatbots-data");
  //   if (!updateChatbot) {
  //     const chatbotName = body?.chatbotText;
  //     let userChatbotsCollection = db.collection("user-chatbots");
  //     userChatbotsCollection.insertOne({
  //       userId,
  //       chatbotId,
  //       chatbotName,
  //     });
  //   }

  //   /// deleting files that needs to be deleted
  //   if (deleteFileList.length > 0) {
  //     /// delete all the files from DB
  //     deleteFileList.forEach(async (file) => {
  //       /// get the file id
  //       const objectId = new ObjectId(file.id);
  //       /// fetch the file to get the data IDs of vector stores
  //       const dbFile = await collection.findOne({
  //         _id: objectId,
  //       });
  //       /// deleting the files by id
  //       await deleteFileVectorsById(userId, dbFile?.dataID);
  //       /// delete the id from db
  //       await collection.deleteOne({
  //         _id: objectId,
  //       });
  //     });
  //   }

  //   /// deleting QA that needs to be deleted
  //   if (deleteQAList.length > 0) {
  //     /// delete all the QA from DB
  //     deleteQAList.forEach(async (qa) => {
  //       /// get the QA id
  //       const objectId = new ObjectId(qa.id);
  //       /// fetch the QA to get the data IDs of vector stores
  //       const dbQA = await collection.findOne({
  //         _id: objectId,
  //       });
  //       /// deleting the qa by id
  //       await deleteFileVectorsById(userId, dbQA?.dataID);
  //       /// delete the id from db
  //       await collection.deleteOne({
  //         _id: objectId,
  //       });
  //     });
  //   }

  //   // return res
  //   //   .status(200)
  //   //   .send({ updateChatbot, updatedQASource, updatedTextSource });

  //   /// prcessing the file data
  //   if (files.length > 0) {
  //     const fileData = files.map(async (file) => {
  //       return new Promise(async (resolve, reject) => {
  //         if (file?.filepath) {
  //           /// read the file contents from the files object
  //           const content = await readContent(file.filepath, file.fileType);
  //           /// generating chunks and embedding
  //           const chunks = await generateChunksNEmbedd(
  //             content,
  //             "file",
  //             chatbotId,
  //             file.name
  //           );
  //           resolve(chunks);
  //         } else {
  //           reject();
  //         }
  //       });
  //     });

  //     const valuesPromiseContainer = await Promise.allSettled(fileData);
  //     /// filter only the resolved promises
  //     const valuesPromise = valuesPromiseContainer.filter(
  //       (result) => result.status === "fulfilled"
  //     );
  //     /// get the filenames and vectors created ID
  //     const fileSource = valuesPromise.map((values) => {
  //       if (values != undefined)
  //         return {
  //           name: values?.value.data[0]?.metadata?.filename,
  //           dataID: values?.value?.dataIDs,
  //           contentLength: values?.value?.contentLength,
  //         };
  //     });

  //     const values = [].concat(...valuesPromise);

  //     /// store the emebeddings in pinecone database
  //     let upserData = values.map((value) => {
  //       return value?.value?.data;
  //     });
  //     upserData = [].concat(...upserData);
  //     if (upserData.length > 0) await upsert(upserData, userId);

  //     /// store the details in database
  //     /// iterate and store each user filename as per chatbot
  //     fileSource.forEach((file) => {
  //       collection.insertOne({
  //         chatbotId,
  //         fileName: file.name,
  //         dataID: file.dataID,
  //         contentLength: file.contentLength,
  //         source: "file",
  //       });
  //     });
  //   }

  //   /// prcessing the text data
  //   if (text.length > 0) {
  //     /// if text has been updated then delete the old data from pinecone and mongo db
  //     if (updateChatbot) {
  //       /// fetch the file to get the data IDs of vector stores
  //       const dbText = await collection.findOne({
  //         chatbotId: chatbotId,
  //         source: "text",
  //       });
  //       if (dbText != null) {
  //         /// deleting the files by id
  //         await deleteFileVectorsById(userId, dbText?.dataID);
  //         /// delete the id from db
  //         await collection.deleteOne({
  //           chatbotId: chatbotId,
  //           source: "text",
  //         });
  //       }
  //     }
  //     /// generating chunks and embedding
  //     const chunks = await generateChunksNEmbedd(text, "text", chatbotId);

  //     /// store the emebeddings in pinecone database
  //     await upsert(chunks.data, userId);

  //     /// store the details in database
  //     /// iterate and store each user filename as per chatbot
  //     collection.insertOne({
  //       chatbotId,
  //       dataID: chunks.dataIDs,
  //       content: text,
  //       source: "text",
  //     });
  //   }

  //   /// prcessing the text data
  //   if (qaList.length > 0) {
  //     /// store the index so that it is easy to map the QA while storing in db
  //     const qaListEmbbedingIndex = [];
  //     /// generating chunks and embedding
  //     const qaData = qaList.map(async (qa, index) => {
  //       return new Promise(async (resolve, reject) => {
  //         /// if qa has id then it need to be deleted and then inserted
  //         if (qa?.id && qa?.updated) {
  //           /// get the QA id
  //           const objectId = new ObjectId(qa.id);
  //           /// fetch the QA to get the data IDs of vector stores
  //           const dbQA = await collection.findOne({
  //             _id: objectId,
  //           });
  //           /// deleting the qa by id
  //           await deleteFileVectorsById(userId, dbQA?.dataID);
  //           /// delete the id from db
  //           await collection.deleteOne({
  //             _id: objectId,
  //           });

  //           /// generating chunks and embedding
  //           const chunks = await generateChunksNEmbedd(
  //             JSON.stringify({ question: qa.question, answer: qa.answer }),
  //             "qa",
  //             chatbotId
  //           );
  //           qaListEmbbedingIndex.push(index);
  //           resolve(chunks);
  //         } else if (qa?.id == undefined) {
  //           /// generating chunks and embedding
  //           const chunks = await generateChunksNEmbedd(
  //             JSON.stringify(qa),
  //             "qa",
  //             chatbotId
  //           );
  //           qaListEmbbedingIndex.push(index);
  //           resolve(chunks);
  //         } else {
  //           reject();
  //         }
  //       });
  //     });

  //     const valuesPromiseContainer = await Promise.allSettled(qaData);
  //     /// filter only the resolved promises
  //     const valuesPromise = valuesPromiseContainer.filter(
  //       (result) => result.status === "fulfilled"
  //     );
  //     /// get the vectors created ID
  //     const qaSource = valuesPromise.map((values) => {
  //       return {
  //         dataID: values?.value?.dataIDs,
  //       };
  //     });

  //     const values = [].concat(...valuesPromise);

  //     /// store the emebeddings in pinecone database
  //     let upserData = values.map((value) => {
  //       return value?.value?.data;
  //     });
  //     upserData = [].concat(...upserData);
  //     if (upserData.length > 0) await upsert(upserData, userId);

  //     /// store the details in database
  //     /// iterate and store each user filename as per chatbot
  //     qaSource.forEach((qa, index) => {
  //       collection.insertOne({
  //         chatbotId,
  //         dataID: qa.dataID,
  //         content: qaList[qaListEmbbedingIndex[index]]?.id
  //           ? {
  //               question: qaList[qaListEmbbedingIndex[index]]?.question,
  //               answer: qaList[qaListEmbbedingIndex[index]]?.answer,
  //             }
  //           : qaList[qaListEmbbedingIndex[index]],
  //         source: "qa",
  //       });
  //     });
  //   }
  //   /// send the response
  //   const responseCode = updateChatbot ? 201 : 200;
  //   const responseText = updateChatbot
  //     ? "Chatbot re-trained successfully"
  //     : "Chabot trained successfully";
  //   return res.status(responseCode).send(responseText);
  // }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
