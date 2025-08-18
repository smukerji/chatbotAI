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

      /// Custom Multi-Query Retriever with Scores
      const llm = new OpenAI({
        apiKey: process.env.NEXT_PUBLIC_OPENAI_KEY,
        model: "gpt-4o",
      });

      // Generate multiple query variations
      const multiQueryPrompt = PromptTemplate.fromTemplate(
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
      );

      // Generate query variations
      const queryVariations = await llm.invoke(
        await multiQueryPrompt.format({
          question: userQuery,
          queryCount: 3,
        })
      );

      // Extract queries from the response
      const extractQueries = (response) => {
        const questionsMatch = response.match(/<questions>(.*?)<\/questions>/s);
        if (questionsMatch) {
          const queries = questionsMatch[1]
            .trim()
            .split("\n")
            .map((q) => q.trim())
            .filter((q) => q.length > 0);

          // Always include the original query as the first query
          const uniqueQueries = [
            userQuery,
            ...queries.filter((q) => q !== userQuery),
          ];
          return uniqueQueries.slice(0, 3); // Limit to 3 queries max
        }
        return [userQuery]; // Fallback to original query
      };

      const queries = extractQueries(queryVariations);

      // Custom multi-query retrieval with scores
      const allResultsWithScores = [];

      // Search with each query variation
      for (const query of queries) {
        try {
          const results = await vectorStore.similaritySearchWithScore(
            query,
            3,
            {
              chatbotId: chatbotId,
            }
          );

          // Add query source to each result
          results.forEach(([doc, score]) => {
            allResultsWithScores.push([doc, score, query]);
          });
        } catch (error) {
          console.error(`Error searching with query "${query}":`, error);
        }
      }

      // Remove duplicates and sort by score
      const uniqueResults = new Map();
      allResultsWithScores.forEach(([doc, score, sourceQuery]) => {
        // Create a unique key based on content and source
        const contentKey =
          (doc.metadata.content || doc.pageContent || "") +
          (doc.metadata.source || "") +
          (doc.metadata.filename || "");

        if (
          !uniqueResults.has(contentKey) ||
          uniqueResults.get(contentKey)[1] > score
        ) {
          uniqueResults.set(contentKey, [doc, score, sourceQuery]);
        }
      });

      // Sort by score (highest scores first) and take top 3
      const retrievedDocsWithScores = Array.from(uniqueResults.values())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([doc, score]) => [doc, score]); // Remove sourceQuery for consistency

      /// extract only needed field from the retrieved documents with scores
      let similaritySearch = retrievedDocsWithScores.map(([doc, score]) => {
        let content = doc.metadata.content || "";
        /// if the meta data has image link add it as the reference in similaritysearch
        if (doc?.metadata?.image_path) {
          content += `<img src=${doc.metadata.image_path} />`;
        }

        let source = "";
        if (doc?.metadata?.source) {
          source = doc.metadata.source;
        }

        let filename = "";
        if (doc?.metadata?.filename) {
          filename = doc.metadata.filename;
        }

        return { content, source, filename, score };
      });

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
