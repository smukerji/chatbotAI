import { PineconeClient } from "@pinecone-database/pinecone";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
require("dotenv").config();
import { v4 as uuid } from "uuid";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { string } from "joi";
const CHUNK_LIMIT = 200;
const CHUNK_MINIMAL = 100;

const PINECONE_API_KEY = String(process.env.NEXT_PUBLIC_PINECONE_KEY);
const PINECONE_ENV = String(process.env.NEXT_PUBLIC_PINECONE_ENV);
const PINECONE_INDEX = String(process.env.NEXT_PUBLIC_PINECONE_INDEX);

export const upsert = async (data: any, batchSize = 250) => {
  const pinecone = new PineconeClient();
  await pinecone.init({
    apiKey: PINECONE_API_KEY,
    environment: PINECONE_ENV,
  });
  const index = pinecone.Index(PINECONE_INDEX);
  const { content, embedding, source_type, namespace, data_type, chatbot_id } =
    data;

  let upsertResponse;
  for (let i = 0; i < content.length; i += batchSize) {
    const contentArr = content.slice(i, i + batchSize);
    const embeddingArr = embedding.slice(i, i + batchSize);
    // console.log(i);

    const upsertRequest: any = {
      vectors: [],
      namespace: namespace,
    };

    for (let j = 0; j < contentArr.length; j++) {
      upsertRequest.vectors.push({
        id: uuid(),
        values: embeddingArr[j],
        metadata: {
          content: contentArr[j],
          data_type,
          chatbot_id,
          source_type,
        },
      });
    }

    // console.log( upsertRequest.vectors);
    // const ns = index.(namespace);
    // return upsertRequest
    try {
      upsertResponse = index.upsert({ upsertRequest: upsertRequest });
    } catch (error: any) {
      console.error("Error during upsert:", error.data);
      return error;
      throw new Error("Failed to perform upsert operation");
    }
  }

  return "Contacts Updated Successfully !";
};

export const chunkArticlesFn = async (article: any) => {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 2000,
    chunkOverlap: 200,
  });
  const output = await splitter.createDocuments([article]);
  const pageContents = output.map((obj) => obj.pageContent);

  const articleChunks = pageContents.map((text) => {
    const trimmedText = text.trim();
    console.log(trimmedText);

    const chunk = {
      content: trimmedText,
      content_length: trimmedText.length,
      // content_tokens: encode(trimmedText).length,
      content_tokens: 120,
      // content_tokens: wordCount(trimmedText).tokenCount,
      embedding: [],
    };
    return chunk;
  });
  // return articleChunks

  if (articleChunks.length > 1) {
    for (let i = 0; i < articleChunks.length; i++) {
      const chunk = articleChunks[i];
      const prevChunk = articleChunks[i - 1];

      if (chunk.content_tokens < CHUNK_MINIMAL && prevChunk) {
        prevChunk.content += " " + chunk.content;
        prevChunk.content_length += chunk.content_length;
        prevChunk.content_tokens += chunk.content_tokens;
        articleChunks.splice(i, 1);
        i--;
      }
    }
  }
  const chunkedSection = [...articleChunks];
  return chunkedSection;
};

export const deletevectors = async (
  userId: any,
  chatbotId: any,
  sourceType: any,
  dataType: any
) => {
  const pinecone = new PineconeClient();
  await pinecone.init({
    apiKey: PINECONE_API_KEY,
    environment: PINECONE_ENV,
  });

  const index = pinecone.Index(PINECONE_INDEX);
  const criteria = {
    namespace: "b",
    filter: {
      chatbot_id: chatbotId,
      data_type: dataType,
      source_type: sourceType,
    },
  };
  // const ns = index(userId);
  const deleteVec = await index._delete({ deleteRequest: criteria });
  return deleteVec;
};

export const queryVectors = async (vector: any) => {
    const pinecone = new PineconeClient();
    await pinecone.init({
      apiKey: PINECONE_API_KEY,
      environment: PINECONE_ENV,
    });
    const index = pinecone.Index(PINECONE_INDEX);
    console.log(vector[0]);
    const cred = {
      topK: 3,
      vector: vector,
      includeMetadata: true,
      // includeValues:true,
      namespace: 'b',
      filter:{
        chatbot_id: "a",
        data_type: "Hubspot"
      },
    };
    const result = await index.query({ queryRequest: cred });
    console.log(result)
    return result;
};
