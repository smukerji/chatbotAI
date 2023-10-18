import { readContent } from "../../app/_helpers/server/ReadContent";
import {
  generateChunksNEmbedd,
  generateChunksNEmbeddForLinks,
} from "../../app/_helpers/server/embeddings";
import { connectDatabase } from "../../db";
import { v4 as uuid } from "uuid";
import { authorize, uploadFile } from "../../app/_services/googleFileUpload";

import {
  deleteFileVectorsById,
  updateVectorsById,
  upsert,
} from "../../app/_helpers/server/pinecone";
import { ObjectId } from "mongodb";
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
      const userId = fields?.userId[0];
      const chatbotId =
        fields?.chatbotId[0] !== "undefined" ? fields?.chatbotId[0] : uuid();
      const crawledList = JSON.parse(fields?.crawledList[0]);
      // console.log("Crawled list", crawledList);
      const deleteCrawlList = JSON.parse(fields?.deleteCrawlList[0]);

      /// using this variable to check if the chatbot needs to be retrained and has updated QA and Text source
      const updateChatbot = JSON.parse(fields?.updateChatbot[0]);

      /// db connection
      const db = (await connectDatabase()).db();
      /// if new chatbot is being created the new chatbot entry
      if (!updateChatbot) {
        const chatbotName = fields?.chatbotText[0];
        let userChatbotsCollection = db.collection("user-chatbots");
        userChatbotsCollection.insertOne({
          userId,
          chatbotId,
          chatbotName,
        });
      }
      let collection = db.collection("chatbots-data");

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

        await generateChunksNEmbeddForLinks(
          crwaledLinkUpsertData,
          "crawling",
          chatbotId,
          userId
        );

        collection.insertOne({
          chatbotId,
          content: dbCrawlSource,
          source: "crawling",
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
}

export const config = {
  api: {
    bodyParser: false,
  },
};
