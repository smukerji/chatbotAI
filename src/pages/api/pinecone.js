import { Pinecone } from "@pinecone-database/pinecone";

import { createEmbedding } from "../../app/_helpers/server/embeddings";
import clientPromise from "../../db";
import { deletevectors } from "../../app/_helpers/server/pinecone";
import { PineconeStore } from "@langchain/pinecone";
import { OpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { MultiQueryRetriever } from "langchain/retrievers/multi_query";
import { openai } from "@/app/openai";

export default async function handler(req, res) {
  if (req.method === "POST") {
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

    /// if req.body is not a string, parse it
    if (typeof req.body === "string") {
      try {
        req.body = JSON.parse(req.body);
      } catch (error) {
        console.error("Error parsing request body:", error);
        return res.status(400).send("Invalid JSON format in request body");
      }
    }
    const body = req.body;
    const userQuery = body?.userQuery;
    const chatbotId = body?.chatbotId;
    const userId = body?.userId;
    const messages = body?.messages ? body?.messages : {};
    // /// create the embedding of user query
    // const embed = await createEmbedding(userQuery);

    // /// set the params of pinecone embeddings retrival
    // const queryRequest = {
    //   vector: embed,
    //   topK: 3,
    //   includeMetadata: true,
    //   filter: {
    //     chatbotId: chatbotId,
    //   },
    // };

    try {
      // const pinecone = new Pinecone({
      //   apiKey: process.env.NEXT_PUBLIC_PINECONE_KEY,
      // });
      // const index = pinecone.index(process.env.NEXT_PUBLIC_PINECONE_INDEX);
      // try {
      //   /// query embeddings
      //   const ns = index.namespace(userId);
      //   const response = await ns.query(queryRequest);
      //   /// extract the content
      //   const extractedContents = response?.matches?.map(
      //     (item) => item.metadata["content"]
      //   );
      //   return res.status(200).send(extractedContents);
      // } catch (error) {
      //   console.error("Error during queryfetch:", error);
      //   return res.status(200).send(error.message);
      // }

      console.log("User Query:", userQuery);
      console.log("Chatbot ID:", chatbotId);
      console.log("User ID:", userId);
      console.log("Messages:", messages);

      const pinecone = new Pinecone({
        apiKey: process.env.NEXT_PUBLIC_PINECONE_KEY,
      });

      const pineconeIndex = pinecone.Index(
        process.env.NEXT_PUBLIC_PINECONE_INDEX
      );
      const vectorStore = await PineconeStore.fromExistingIndex(
        new OpenAIEmbeddings({ apiKey: process.env.NEXT_PUBLIC_OPENAI_KEY }),
        { pineconeIndex, namespace: userId }
      );

      /// retrieve the similarity search results
      const llm = new OpenAI({
        apiKey: process.env.NEXT_PUBLIC_OPENAI_KEY,
        model: "gpt-4o",
      });
      const retriever = MultiQueryRetriever.fromLLM({
        llm: llm,
        prompt: PromptTemplate.fromTemplate(
          `You are an AI language model assistant. Your task is
          to generate {queryCount} different versions of the given user
          question corresponding to the Chat History to retrieve relevant documents from a vector database.
          By generating multiple perspectives on the user question,
          your goal is to help the user overcome some of the limitations
          of distance-based similarity search.

          Replace any number or words like it, that, etc according to the user's flow.

          Provide these alternative questions separated by newlines between XML tags. For example:

          <questions>
          Question 1
          Question 2
          Question 3
          </questions>

          Chat History: {chatHistory}

          Original question: {question}`,
          { partialVariables: { chatHistory: JSON.stringify(messages) } }
        ),
        retriever: vectorStore.asRetriever({
          filter: { chatbotId: chatbotId },
        }),
      });

      /// getting the relveant similaritiy search
      const retrievedDocs = (await retriever.invoke(userQuery)).slice(0, 3);
      let similaritySearch = "";
      for (const doc of retrievedDocs) {
        similaritySearch += doc.metadata.content;

        /// if the meta data has image link add it as the reference in similaritysearch
        if (doc?.metadata?.image_path) {
          similaritySearch += `<img src=${doc.metadata.image_path} />`;
        }
      }

      console.log("Similarity Search Result:", similaritySearch);

      return res.status(200).send(similaritySearch);
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
    const db = (await clientPromise).db();
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

    /// delete the assistant from openai
    try {
      const assistant = await openai.beta.assistants.del(chatbotId);
    } catch (error) {
      console.error("Error during assistant deletion:", error);
    }

    vectorId = [].concat(...vectorId);
    /// delete the vectors
    const deleteData = await collection.deleteMany({ chatbotId: chatbotId });
    /// delete the chatbot
    await userChatbots.deleteOne({ chatbotId: chatbotId });
    /// delete chatbot settings
    await userChatbotSettings.deleteOne({ chatbotId: chatbotId });

    //delete the whatsapp details collection record against chatbotId
    const whatsappDetails = db.collection("whatsappbot_details"); //whatsappbot_details
    await whatsappDetails.deleteOne({ chatbotId: chatbotId });

    //delete the telegram details collection's record against chatbotId
    const telegramDetails = db.collection("telegram-bot"); //whatsappbot_details
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
