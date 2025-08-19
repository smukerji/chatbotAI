import { readContent } from "../../app/_helpers/server/ReadContent";
import {
  generateChunksNEmbedd,
  generateChunksNEmbeddExcel,
  generateChunksNEmbeddForLinks,
  generateChunksNEmbeddViaDocling,
} from "../../app/_helpers/server/embeddings";
import clientPromise from "../../db";
import userSchemaClientPromise from "../../userSchemaDb";
import { v4 as uuid } from "uuid";
// import { authorize, uploadFile } from "../../app/_services/googleFileUpload";
import { put } from "@vercel/blob";
import fs from "fs";
import { emailService } from "../../app/_services/emailService";
import {
  contactUsBase64,
  createNewChatbotMail,
  logo,
} from "../../app/_helpers/emailImagesBase64Constants";
import {
  chatbotBubbleAlignment,
  defaultChatBubbleIconColor,
  defaultLeadTitle,
  defaultLeadUserDetails,
  defaultModelInstruction,
  defaultPlaceholderMessage,
  defaultSuggestedMessage,
  defaultUserMessageColor,
  initialMessage,
  models,
  theme,
  visibility,
} from "../../app/_helpers/constant";
import {
  getAssistantTools,
  getSystemInstruction,
} from "../../app/_helpers/assistant-creation-contants";
import OpenAI from "openai";

import {
  deleteFileVectorsById,
  updateVectorsById,
  upsert,
} from "../../app/_helpers/server/pinecone";
import { ObjectId } from "mongodb";
const formidable = require("formidable");

import * as postmark from "postmark";
import e from "express";
const client = new postmark.ServerClient(process.env.POST_MARK_TOKEN);

export const maxDuration = 300;

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const form = new formidable.IncomingForm();
      form.parse(req, async (err, fields, QAfiles) => {
        if (err) {
          console.error(err);
          res.status(500).send("Error parsing formdata");
          return;
        }

        const files = JSON.parse(fields?.defaultFileList);
        const userId = fields?.userId[0];
        const numberOfCharacterTrained = fields?.numberOfCharacterTrained[0];
        const chatbotName = fields?.chatbotText[0];

        /// using this variable to check if the chatbot needs to be retrained and has updated QA and Text source
        const updateChatbot = JSON.parse(fields?.updateChatbot[0]);

        /// db connection
        const db = (await clientPromise).db();
        const userSchemaClient = (await userSchemaClientPromise).db();

        /// first check if user can create the chatbot or not
        const noOfChatbotsUserCreated = await db
          .collection("user-chatbots")
          .countDocuments({ userId: userId });

        /// get the number of chatbot user can create from plan table
        const planDetails = await db.collection("user-details").findOne({
          userId: userId,
        });

        if (
          planDetails?.chatbotLimit < noOfChatbotsUserCreated + 1 &&
          !updateChatbot
        ) {
          res
            .status(500)
            .send(
              "Sorry you cannot create the chatbot. Please upgrade your plan."
            );

          return;
        }

        /// if assistant is being created for the first time
        let assistant;
        const assistantType = fields?.assistantType[0];
        if (!updateChatbot) {
          /// create the openai object
          const openai = new OpenAI({
            apiKey: process.env.NEXT_PUBLIC_OPENAI_KEY,
            project: process.env.NEXT_PUBLIC_OPENAI_PROJ_KEY,
            organization: process.env.NEXT_PUBLIC_OPENAI_ORG_KEY,
          });

          /// create the assistant based on the type of assistant with the necessary instructions and function calls
          const systemInstruction = getSystemInstruction(assistantType);
          const tools = getAssistantTools(assistantType);
          assistant = await openai.beta.assistants.create({
            model: models[0],
            instructions: systemInstruction,
            name: chatbotName,
            tools: tools,
            temperature: 1,
          });
        }

        const chatbotId =
          fields?.chatbotId[0] !== "undefined"
            ? fields?.chatbotId[0]
            : assistant.id;

        const qaList = JSON.parse(fields?.qaList);
        const text = fields?.text[0];
        const crawledList = JSON.parse(fields?.crawledList[0]);
        const deleteCrawlList = JSON.parse(fields?.deleteCrawlList[0]);
        const isTextUpdated = JSON.parse(fields?.isTextUpdated[0]);

        /// deleting the file list
        const deleteFileList = JSON.parse(fields?.deleteFileList[0]);
        /// deleting the QA list
        const deleteQAList = JSON.parse(fields?.deleteQAList[0]);

        /// assistant type and secrets
        const botType = fields?.botType[0];
        let integrations = {};
        if (!updateChatbot) {
          integrations = JSON.parse(fields?.integrations[0]);
        }

        /// Storing the images
        const areImagesStoredPromise = qaList.map((qa, i) => {
          return new Promise((resolve, reject) => {
            // Check if an image file is present for this Q&A pair
            const imageFile = QAfiles[`qaList[${i}].image`];

            /// store the images files in server
            if (imageFile) {
              qa.image = uuid() + "-" + imageFile[0].originalFilename;
              /// store the images
              const oldPath = imageFile[0].filepath;

              const readStream = fs.createReadStream(oldPath);

              /// store image on vercel
              put(imageFile[0].originalFilename, readStream, {
                access: "public",
              })
                .then((blob) => {
                  qa.image = blob.url;
                  console.log("Stored file to vercel", qa.image);
                  resolve(1);
                })
                .catch((err) => {
                  console.log("Error storing file", err);
                  reject(err);
                });
            } else {
              qa.image = qa.image == "" ? null : qa.image; // Use the file path or null if no image
              resolve(1);
            }
          });
        });

        /// if new chatbot is being created the new chatbot entry
        let collection = db.collection("chatbots-data");

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
            /// if the file is xlsx or csv then delete the collection4
            if (
              file?.name?.toLowerCase()?.includes(".xlsx") ||
              file?.name?.toLowerCase()?.includes(".csv")
            ) {
              /// delete the collection that is present in the schema_info
              /// get all the object keys
              const schemaInfo = dbFile?.schema_info;

              if (schemaInfo && typeof schemaInfo === "object") {
                const objectKeysCollection = Object.keys(schemaInfo);
                // iterate and delete the collection
                for (let collection of objectKeysCollection) {
                  const collectionToDelete =
                    userSchemaClient.collection(collection);
                  await collectionToDelete.drop();
                }
              }
              // const objectKeysCollection = Object.keys(schemaInfo);

              // /// iterate and delete the collection
              // for (let collection of objectKeysCollection) {
              //   const collectionToDelete =
              //     userSchemaClient.collection(collection);
              //   await collectionToDelete.drop();
              // }
            } else {
              /// deleting the files by id
              await deleteFileVectorsById(userId, dbFile?.dataID);
            }
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

        /// deleting weblinks that needs to be deleted
        if (deleteCrawlList.length > 0) {
          /// get all the links to remove to match the links to delete
          const cursor = await collection.findOne({
            chatbotId: chatbotId,
            source: "crawling",
          });
          const currentCrawlList = cursor?.content;

          /// array to delete all the vectors from pinecone
          let vectorIDs = [];

          /// filtering the links to be deleted from DB and pinecone
          const updatedCrawltList = currentCrawlList.filter((item) => {
            return !deleteCrawlList.some((deleteItem) => {
              if (item.crawlLink === deleteItem.crawlLink) {
                vectorIDs.push(item.dataID);
                return true;
              }
              return false;
            });
          });
          vectorIDs = [].concat(...vectorIDs);
          /// delete links from pinecone
          await deleteFileVectorsById(userId, vectorIDs);
          /// update the link in DB
          await collection.updateOne(
            {
              chatbotId: chatbotId,
              source: "crawling",
            },
            {
              $set: { content: updatedCrawltList },
            }
          );
        }

        /// prcessing the file data
        if (files.length > 0) {
          const fileData = files.map(async (file, index) => {
            return new Promise(async (resolve, reject) => {
              if (file?.filepath) {
                /// read the file contents from the files object
                // const content = await readContent(file.filepath, file.fileType);
                // console.log("FileData >>>>>>>>>>", file);
                const content = file.fileText;
                /// process the excel data differently
                if (
                  file.fileType ===
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
                  file.fileType === "text/csv"
                ) {
                  /// generating chunks and embedding
                  // const chunks = await generateChunksNEmbeddExcel(
                  //   content,
                  //   "file",
                  //   chatbotId,
                  //   userId,
                  //   file.name
                  // );
                  /// store in the database schema info
                  await collection.insertOne({
                    chatbotId,
                    fileName: file.name,
                    schema_info: file.schema_info,
                    contentLength: JSON.stringify(file.schema_info).length,
                    source: "file",
                  });

                  resolve(1);
                } else {
                  /// generating chunks and embedding
                  const chunks = await generateChunksNEmbeddViaDocling(
                    content,
                    "file",
                    chatbotId,
                    userId,
                    file.name
                  );
                  resolve(chunks);
                }
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
            if (
              values != undefined &&
              values?.value.data?.[0]?.metadata?.filename
            )
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
          // if (upserData.length > 0) await upsert(upserData, userId);

          /// store the details in database
          /// iterate and store each user filename as per chatbot
          fileSource.forEach((file) => {
            if (file?.name) {
              collection.insertOne({
                chatbotId,
                fileName: file.name,
                dataID: file.dataID,
                contentLength: file.contentLength,
                source: "file",
              });
            }
          });
          //   }
        }

        /// prcessing the text data
        /// if text has been updated then delete the old data from pinecone and mongo db
        if (updateChatbot && isTextUpdated) {
          /// fetch the text to get the data IDs of vector stores
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

        /// embed the text
        if (
          text.length > 0 &&
          (!updateChatbot || (updateChatbot && isTextUpdated))
        ) {
          // Generating chunks and embedding
          const chunks = await generateChunksNEmbedd(
            text,
            "text",
            chatbotId,
            ""
          );

          // Store the embeddings in Pinecone database
          await upsert(chunks.data, userId);

          // Store the details in the database
          collection.insertOne({
            chatbotId,
            dataID: chunks.dataIDs,
            content: text,
            source: "text",
          });
        }

        /// prcessing the QA data
        if (qaList.length > 0 && areImagesStoredPromise.length > 0) {
          await Promise.all(areImagesStoredPromise);
          /// store the index so that it is easy to map the QA while storing in db
          // const qaListEmbbedingIndex = [];
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
                  qa.image
                    ? JSON.stringify({
                        question: qa.question,
                        answer: `${qa.answer}` + `image: ${qa.image}`,
                        // filename: qa.image,
                      })
                    : JSON.stringify({
                        question: qa.question,
                        answer: qa.answer,
                        // filename: qa.image,
                      }),
                  "qa",
                  chatbotId,
                  ""
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
                        filename: qa.image,
                      },
                    },
                  }
                );
                reject();
              } else if (qa?.id == undefined) {
                /// generating chunks and embedding
                const chunks = await generateChunksNEmbedd(
                  qa.image
                    ? JSON.stringify({
                        question: qa.question,
                        answer: `${qa.answer}` + `image: ${qa.image}`,
                        // filename: qa.image,
                      })
                    : JSON.stringify({
                        question: qa.question,
                        answer: qa.answer,
                        // filename: qa.image,
                      }),
                  "qa",
                  chatbotId,
                  ""
                );
                // qaListEmbbedingIndex.push(index);
                /// insert the data to DB
                await collection.insertOne({
                  chatbotId,
                  dataID: chunks.dataIDs,
                  content: {
                    question: qa.question,
                    answer: qa.answer,
                    filename: qa.image,
                  },
                  source: "qa",
                });
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
          const values = [].concat(...valuesPromise);
          /// store the emebeddings in pinecone database
          let upserData = values.map((value) => {
            return value?.value?.data;
          });
          upserData = [].concat(...upserData);
          // console.log(upserData);
          if (upserData.length > 0) {
            await upsert(upserData, userId);
          }
        }

        /// processing the links
        if (crawledList.length > 0 && !updateChatbot) {
          /// geenrated the ID's for each chunks and storing in DB before upserting in pinecone
          const dbCrawlSource = [];
          let crwaledLinkUpsertData = crawledList.map((obj) => {
            const tempIds = [];
            const tempData = [];
            obj.cleanedText?.forEach((element) => {
              const id = uuid();
              /// map the chunks to id
              tempData.push({ element, id, link: obj?.crawlLink });
              tempIds.push(id);
            });

            /// add the link data to array
            dbCrawlSource.push({
              crawlLink: obj?.crawlLink,
              dataID: tempIds,
              charCount: obj.charCount,
            });
            return tempData;
          });
          crwaledLinkUpsertData = [].concat(...crwaledLinkUpsertData);

          try {
            await generateChunksNEmbeddForLinks(
              crwaledLinkUpsertData,
              "crawling",
              chatbotId,
              userId
            ).then(() => {
              collection.insertOne({
                chatbotId,
                content: dbCrawlSource,
                source: "crawling",
              });
            });
          } catch (err) {
            return res.status(400).send(err);
          }
        } else if (crawledList.length > 0 && updateChatbot) {
          /// geenrated the ID's for each chunks and storing in DB before upserting in pinecone
          const dbCrawlSource = [];

          let crwaledLinkUpsertData = crawledList.map((obj) => {
            const tempIds = [];
            const tempData = [];
            console.log("Link >>>>>>>", obj?.crawlLink);
            obj.cleanedText?.forEach((element) => {
              const id = uuid();
              /// map the chunks to id
              tempData.push({ element, id, link: obj?.crawlLink });
              tempIds.push(id);
            });

            /// add the link data to array
            if (obj?.cleanedText?.length > 0) {
              dbCrawlSource.push({
                crawlLink: obj?.crawlLink,
                dataID: tempIds,
                charCount: obj.charCount,
              });
            }
            return tempData;
          });
          crwaledLinkUpsertData = [].concat(...crwaledLinkUpsertData);

          try {
            await generateChunksNEmbeddForLinks(
              crwaledLinkUpsertData,
              "crawling",
              chatbotId,
              userId
            ).then(async () => {
              /// get the previous content
              const previousLinksContent = await collection.findOne({
                chatbotId: chatbotId,
                source: "crawling",
              });
              collection.findOneAndUpdate(
                { chatbotId: chatbotId, source: "crawling" },
                {
                  $set: {
                    content:
                      previousLinksContent?.content?.length > 0
                        ? [...previousLinksContent.content, ...dbCrawlSource]
                        : dbCrawlSource,
                  },
                },
                { upsert: true }
              );
            });
          } catch (err) {
            console.log("Error while processing links", err);
            return res.status(400).send(err);
          }
        }
        /// send the response
        const responseCode = updateChatbot ? 201 : 200;
        const responseText = updateChatbot
          ? "Chatbot re-trained successfully"
          : "Chabot trained successfully";

        if (!updateChatbot) {
          const currrentTime = new Date().getTime();
          /// create the chatbot entry in DB
          let userChatbotsCollection = db.collection("user-chatbots");

          await userChatbotsCollection.insertOne({
            userId,
            chatbotId: chatbotId,
            chatbotName,
            lastUsed: currrentTime,
            createdAt: currrentTime,
            noOfMessagesSent: 0,
            botType: botType,
            integrations: integrations,
            assistantType: assistantType,
          });
          //send email once chatbot is created
          try {
            const result = await db
              .collection("users")
              .findOne({ _id: new ObjectId(userId) });
            const email = result?.email;
            const temailService = emailService();
            await temailService.send(
              "create-chatbot-template",
              [createNewChatbotMail, logo],
              email,
              {
                name: result?.username,
              }
            );

            // await client.sendEmail({
            //   From: process.env.SENDERS_EMAIL,
            //   To: email,
            //   MessageStream: "outbound",
            // })
          } catch (error) {
            console.log("Error while sending email", error);
          }

          const systemInstruction = getSystemInstruction(assistantType);

          /// set the default settings for the chatbot in DB
          await db.collection("chatbot-settings").insertOne({
            userId: userId,
            chatbotId: chatbotId,
            model: models[0],
            visibility: visibility.PUBLIC,
            temperature: 1,
            numberOfCharacterTrained: numberOfCharacterTrained,
            instruction: systemInstruction,
            initialMessage: initialMessage,
            suggestedMessages: defaultSuggestedMessage,
            messagePlaceholder: defaultPlaceholderMessage,
            theme: theme.LIGHT,
            userMessageColor: defaultUserMessageColor,
            chatbotIconColor: defaultChatBubbleIconColor,
            profilePictureUrl: "",
            bubbleIconUrl: "",
            chatbotDisplayName: chatbotName,
            lastTrained: currrentTime,
            chatbotBubbleAlignment: chatbotBubbleAlignment.LEFT,
            noOfMessagesSent: 0,
            leadFields: {
              name: { isChecked: false, value: "name" },
              email: { isChecked: true, value: "email" },
              number: { isChecked: false, value: "number" },
            },
            leadTitle: defaultLeadTitle,
            userDetails: defaultLeadUserDetails,
          });
        } else {
          /// if chatbot is being updated just update the timestamp and characters
          await db.collection("chatbot-settings").updateOne(
            { userId: userId, chatbotId: chatbotId },
            {
              $set: {
                numberOfCharacterTrained: numberOfCharacterTrained,
                lastTrained: new Date().getTime(),
              },
            }
          );
        }
        return res.status(responseCode).send(responseText);
      });
    } catch (error) {
      console.log("Error >>>>>", error);
      return res.status(400).send(error);
    }
  } else {
    res.status(405).send("Method not allowed");
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
