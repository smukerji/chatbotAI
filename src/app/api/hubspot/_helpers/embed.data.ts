import { createEmbeddings } from "./openAI";
import { chunkArticlesFn, queryVectors, upsert } from "./pinecone";
import { NextResponse } from "next/server";

export const createVectorStore = async (
  data: any,
  chatbotId: any,
  userId: any,
  datatype : any,
  sourcetype : any
) => {
  const chunkedArticles = await chunkArticlesFn(data);
  const contentArray = chunkedArticles.map((obj) => obj.content);
  const embedding = await createEmbeddings(contentArray);
  return await upsert({
    content: contentArray,
    embedding: embedding,
    source_type: sourcetype,
    data_type : datatype,
    chatbot_id : chatbotId,
    namespace: userId,
  });
};
export const createVectorStoreQuery = async (
  data: any,
  chatbotId: any,
  userId: any,
  datatype : any,
  sourcetype : any
) => {
  const chunkedArticles = await chunkArticlesFn(data);
  const contentArray = chunkedArticles.map((obj) => obj.content);
  const embedding = await createEmbeddings(contentArray);
  return await queryVectors(embedding)
}