import { readContent } from '../../app/_helpers/server/ReadContent';
import {
  generateChunksNEmbedd,
  generateChunksNEmbeddForLinks,
} from '../../app/_helpers/server/embeddings';
import clientPromise from '../../db';
import { v4 as uuid } from 'uuid';
// import { authorize, uploadFile } from "../../app/_services/googleFileUpload";
import { put } from '@vercel/blob';
import fs from 'fs';
import { emailService } from '../../app/_services/emailService';
import {
  createNewChatbotMail,
  logo,
} from '../../app/_helpers/emailImagesBase64Constants';
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
} from '../../app/_helpers/constant';

import {
  deleteFileVectorsById,
  updateVectorsById,
  upsert,
} from '../../app/_helpers/server/pinecone';
import { ObjectId } from 'mongodb';
const formidable = require('formidable');

export const maxDuration = 60;

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const form = new formidable.IncomingForm();
      form.parse(req, async (err, fields, QAfiles) => {
        if (err) {
          console.error(err);
          res.status(500).send('Error parsing formdata');
          return;
        }
        // const qaImage = QAfiles?.qaImage ? QAfiles?.qaImage[0] : null;
        // console.log(JSON.parse(fields?.qaList));
        // return;
        const files = JSON.parse(fields?.defaultFileList);
        const userId = fields?.userId[0];
        const numberOfCharacterTrained = fields?.numberOfCharacterTrained[0];

        /// using this variable to check if the chatbot needs to be retrained and has updated QA and Text source
        const updateChatbot = JSON.parse(fields?.updateChatbot[0]);

        /// db connection
        const db = (await clientPromise).db();

        /// first check if user can create the chatbot or not
        const noOfChatbotsUserCreated = await db
          .collection('user-chatbots')
          .countDocuments({ userId: userId });

        /// get the number of chatbot user can create from plan table
        const planDetails = await db.collection('user-details').findOne({
          userId: userId,
        });

        if (
          planDetails?.chatbotLimit < noOfChatbotsUserCreated + 1 &&
          !updateChatbot
        ) {
          res
            .status(500)
            .send(
              'Sorry you cannot create the chatbot. Please upgrade your plan.'
            );

          return;
        }

        const chatbotId =
          fields?.chatbotId[0] !== 'undefined' ? fields?.chatbotId[0] : uuid();
        const qaList = JSON.parse(fields?.qaList);
        const text = fields?.text[0];
        const crawledList = JSON.parse(fields?.crawledList[0]);
        const deleteCrawlList = JSON.parse(fields?.deleteCrawlList[0]);
        const isTextUpdated = JSON.parse(fields?.isTextUpdated[0]);
        // return;
        // console.log(chatbotId);
        // return;

        /// deleting the file list
        const deleteFileList = JSON.parse(fields?.deleteFileList[0]);
        /// deleting the QA list
        const deleteQAList = JSON.parse(fields?.deleteQAList[0]);

        /// Storing the images
        const areImagesStoredPromise = qaList.map((qa, i) => {
          return new Promise((resolve, reject) => {
            // Check if an image file is present for this Q&A pair
            const imageFile = QAfiles[`qaList[${i}].image`];

            // qa.image = imageFile
            //   ? uuid() + "-" + imageFile[0].originalFilename
            //   : qa.image == ""
            //   ? null
            //   : qa.image; // Use the file path or null if no image

            /// store the images files in server
            if (imageFile) {
              qa.image = uuid() + '-' + imageFile[0].originalFilename;
              /// store the images
              var oldPath = imageFile[0].filepath;

              const readStream = fs.createReadStream(oldPath);

              /// store image on vercel
              put(imageFile[0].originalFilename, readStream, {
                access: 'public',
              })
                .then((blob) => {
                  qa.image = blob.url;
                  console.log('Stored file to vercel', qa.image);
                  resolve(1);
                })
                .catch((err) => {
                  console.log('Error storing file', err);
                  reject(err);
                });

              /// store the file on google drive
              // authorize()
              //   .then((authClient) =>
              //     uploadFile(authClient, oldPath, qa.image)
              //       .then((file) => {
              //         qa.image = file.data.id;
              //         console.log("Stored file to drive", qa.image);
              //         resolve(1);
              //       })
              //       .catch((err) => {
              //         console.log("Error storing file", err);
              //         reject(err);
              //       })
              //   )
              //   .catch((err) => {
              //     console.log("Error uploading file to Google Drive:", err);
              //     reject(err);
              //   });
              /// move the file from tmp to server
              // mv(oldPath, newPath, function (err) {
              //   console.log("Error storing file", err);
              // });
            } else {
              qa.image = qa.image == '' ? null : qa.image; // Use the file path or null if no image
              resolve(1);
            }
          });
        });
        // for (let i = 0; i < qaList.length; i++) {
        //   // qaList.push(qaItem);
        // }
        // console.log("QAlist", qaList);
        // const responseCode = updateChatbot ? 200 : 200;
        // const responseText = updateChatbot
        //   ? "Chatbot re-trained successfully"
        //   : "Chabot trained successfully";
        // return res.status(responseCode).send(responseText);

        // console.log(qaList);

        /// if new chatbot is being created the new chatbot entry
        let collection = db.collection('chatbots-data');

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

        /// deleting weblinks that needs to be deleted
        if (deleteCrawlList.length > 0) {
          /// get all the links to remove to match the links to delete
          const cursor = await collection.findOne({
            chatbotId: chatbotId,
            source: 'crawling',
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
              source: 'crawling',
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
                /// generating chunks and embedding
                const chunks = await generateChunksNEmbedd(
                  content,
                  'file',
                  chatbotId,
                  userId,
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
            (result) => result.status === 'fulfilled'
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
          // if (upserData.length > 0) await upsert(upserData, userId);

          /// store the details in database
          /// iterate and store each user filename as per chatbot
          fileSource.forEach((file) => {
            collection.insertOne({
              chatbotId,
              fileName: file.name,
              dataID: file.dataID,
              contentLength: file.contentLength,
              source: 'file',
            });
          });
          //   }
        }

        /// prcessing the text data
        /// if text has been updated then delete the old data from pinecone and mongo db
        if (updateChatbot && isTextUpdated) {
          /// fetch the text to get the data IDs of vector stores
          const dbText = await collection.findOne({
            chatbotId: chatbotId,
            source: 'text',
          });
          if (dbText != null) {
            /// deleting the files by id
            await deleteFileVectorsById(userId, dbText?.dataID);
            /// delete the id from db
            await collection.deleteOne({
              chatbotId: chatbotId,
              source: 'text',
            });
          }
        }
        if (text.length > 0 && !updateChatbot) {
          /// generating chunks and embedding
          const chunks = await generateChunksNEmbedd(
            text,
            'text',
            chatbotId,
            ''
          );

          /// store the emebeddings in pinecone database
          await upsert(chunks.data, userId);

          /// store the details in database
          /// iterate and store each user filename as per chatbot
          collection.insertOne({
            chatbotId,
            dataID: chunks.dataIDs,
            content: text,
            source: 'text',
          });
        } else if (text.length > 0 && updateChatbot && isTextUpdated) {
          /// generating chunks and embedding
          const chunks = await generateChunksNEmbedd(
            text,
            'text',
            chatbotId,
            ''
          );

          /// store the emebeddings in pinecone database
          await upsert(chunks.data, userId);

          /// store the details in database
          /// iterate and store each user filename as per chatbot
          collection.insertOne({
            chatbotId,
            dataID: chunks.dataIDs,
            content: text,
            source: 'text',
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
                  'qa',
                  chatbotId,
                  ''
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
                        answer:
                          `${qa.answer}` +
                          `image: https://drive.google.com/uc?export=view&id=${qa.image}`,
                        // filename: qa.image,
                      })
                    : JSON.stringify({
                        question: qa.question,
                        answer: qa.answer,
                        // filename: qa.image,
                      }),
                  'qa',
                  chatbotId,
                  ''
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
                  source: 'qa',
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
            (result) => result.status === 'fulfilled'
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
              tempData.push({ element, id });
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
              'crawling',
              chatbotId,
              userId
            ).then(() => {
              collection.insertOne({
                chatbotId,
                content: dbCrawlSource,
                source: 'crawling',
              });
            });
          } catch (err) {
            return res.status(400).send(err);
          }
          // setTimeout(() => {
          //   console.log("db crawl source", dbCrawlSource);
          // }, 5000);
        } else if (crawledList.length > 0 && updateChatbot) {
          /// geenrated the ID's for each chunks and storing in DB before upserting in pinecone
          const dbCrawlSource = [];
          let crwaledLinkUpsertData = crawledList.map((obj) => {
            const tempIds = [];
            const tempData = [];
            obj.cleanedText?.forEach((element) => {
              const id = uuid();
              /// map the chunks to id
              tempData.push({ element, id });
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
              'crawling',
              chatbotId,
              userId
            ).then(async () => {
              /// get the previous content

              const previousLinksContent = await collection.findOne({
                chatbotId: chatbotId,
                source: 'crawling',
              });

              console.log('Db crawlinfg source', dbCrawlSource);

              collection.findOneAndUpdate(
                { chatbotId: chatbotId, source: 'crawling' },
                {
                  $set: {
                    content:
                      previousLinksContent?.content?.length > 0
                        ? [...previousLinksContent?.content, ...dbCrawlSource]
                        : dbCrawlSource,
                  },
                },
                { upsert: true }
              );
            });
          } catch (err) {
            console.log('Error while processing links', err);
            return res.status(400).send(err);
          }
        }
        /// send the response
        const responseCode = updateChatbot ? 201 : 200;
        const responseText = updateChatbot
          ? 'Chatbot re-trained successfully'
          : 'Chabot trained successfully';

        if (!updateChatbot) {
          const currrentTime = new Date().getTime();
          /// create the chatbot entry in DB
          const chatbotName = fields?.chatbotText[0];
          let userChatbotsCollection = db.collection('user-chatbots');
          await userChatbotsCollection.insertOne({
            userId,
            chatbotId,
            chatbotName,
            lastUsed: currrentTime,
            createdAt: currrentTime,
            noOfMessagesSent: 0,
          });
          //send email once chatbot is created
          try {
            const result = await db
              .collection('users')
              .findOne({ _id: new ObjectId(userId) });
            const email = result?.email;
            const temailService = emailService();
            await temailService.send(
              'create-chatbot-template',
              [createNewChatbotMail, logo],
              email,
              {
                name: result?.username,
              }
            );
          } catch (error) {
            return res.status(400).send(error);
          }
          /// set the default settings for the chatbot in DB
          await db.collection('chatbot-settings').insertOne({
            userId: userId,
            chatbotId: chatbotId,
            model: models[0],
            visibility: visibility.PUBLIC,
            temperature: 0,
            numberOfCharacterTrained: numberOfCharacterTrained,
            instruction: defaultModelInstruction,
            initialMessage: initialMessage,
            suggestedMessages: defaultSuggestedMessage,
            messagePlaceholder: defaultPlaceholderMessage,
            theme: theme.LIGHT,
            userMessageColor: defaultUserMessageColor,
            chatbotIconColor: defaultChatBubbleIconColor,
            profilePictureUrl: '',
            bubbleIconUrl: '',
            chatbotDisplayName: chatbotName,
            lastTrained: currrentTime,
            chatbotBubbleAlignment: chatbotBubbleAlignment.LEFT,
            noOfMessagesSent: 0,
            leadFields: {
              name: { isChecked: false, value: 'name' },
              email: { isChecked: false, value: 'email' },
              number: { isChecked: false, value: 'number' },
            },
            leadTitle: defaultLeadTitle,
            userDetails: defaultLeadUserDetails,
          });
        } else {
          /// if chatbot is being updated just update the timestamp and characters
          await db.collection('chatbot-settings').updateOne(
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
      console.log('Error >>>>>', error);
      return res.status(400).send(error);
    }
  } else {
    res.status(405).send('Method not allowed');
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
