import { OpenAI } from "openai";
import { v4 as uuidv4 } from "uuid";
import { upsert } from "./pinecone";

/// getting the openai obj
export function openaiObj(): OpenAI {
  const openai = new OpenAI({ apiKey: process.env.NEXT_PUBLIC_OPENAI_KEY });
  return openai;
}

export async function generateChunksNEmbeddForLinks(
  crwaledLinkUpsertData: any[],
  source: string,
  chatbotId: string,
  userId: string,
  filename: string = "none"
) {
  const crawlData = crwaledLinkUpsertData.map((item) => item.element);
  const crawlDataId = crwaledLinkUpsertData.map((item) => item.id);

  /// creating chunks with batch size 250
  const batchSize = 150;
  /// creating embeddings
  for (let i = 0; i < crawlData.length; i += batchSize) {
    const upsertData: any = [];
    const batch = crawlData.slice(i, i + batchSize);
    const batchId = crawlDataId.slice(i, i + batchSize);
    try {
      const batchEmbedding: any = await openaiObj().embeddings.create({
        model: "text-embedding-ada-002",
        input: batch,
      });
      batchEmbedding.data.map((embeddingData: any, index: number) => {
        upsertData.push({
          metadata: {
            content: batch[index],
            source,
            filename,
            chatbotId,
          },
          values: embeddingData.embedding,
          id: batchId[index],
        });
      });
      await upsert(upsertData, userId);
    } catch (error: any) {
      console.log("Upsert data of links error", error);
      throw new Error(error?.message);

      console.log(
        "Error while creating embedding for website crawling",
        error?.response?.data
      );
    }
  }
}

export async function generateChunksNEmbeddExcel(
  content: any[],
  source: string,
  chatbotId: string,
  userId: string,
  filename: string = "none"
) {
  // /// split the content in 1000 characters
  // let start = 0;
  // let end = content.length;
  let contentLength = 0;

  /// storing the chunks
  const chunks: any = content.map((item) => {
    const text = JSON.stringify(item);
    contentLength += text.length;
    return text;
  });

  /// creating chunks with batch size 2000
  const batchSize = 250;
  let data: any = [];
  let dataIDs: any = [];
  /// creating embeddings
  for (let i = 0; i < chunks.length; i += batchSize) {
    let tempData: any = [];
    const batch = chunks.slice(i, i + batchSize);
    const batchEmbedding: any = await openaiObj().embeddings.create({
      model: "text-embedding-ada-002",
      input: batch,
    });
    batchEmbedding.data.map((embeddingData: any, index: number) => {
      const id = uuidv4();
      dataIDs.push(id);
      /// storing in response data
      data.push({
        metadata: { content: chunks[index], source, filename, chatbotId },
        values: embeddingData.embedding,
        id: id,
      });

      tempData.push({
        metadata: { content: chunks[index], source, filename, chatbotId },
        values: embeddingData.embedding,
        id: id,
      });
    });

    /// currently being used to upsert on files data
    if (userId != "") {
      await upsert(tempData, userId);
    }
  }

  return { data, dataIDs, contentLength };
}

export async function generateChunksNEmbedd(
  content: string,
  source: string,
  chatbotId: string,
  userId: string,
  filename: string = "none"
) {
  /// split the content in 1000 characters
  let start = 0;
  let end = content.length;
  const contentLength = content.length;

  /// storing the chunks
  const chunks: any = [];
  /// iterate until the end of content is not reached
  await new Promise((resolve) => {
    while (start < end) {
      const subStr = content.substring(start, start + 1000);
      chunks.push(subStr);
      start += 900;
    }

    if (start > end) {
      resolve(1);
    }
  });

  /// creating chunks with batch size 2000
  const batchSize = 250;
  let data: any = [];
  let dataIDs: any = [];
  /// creating embeddings
  for (let i = 0; i < chunks.length; i += batchSize) {
    let tempData: any = [];
    const batch = chunks.slice(i, i + batchSize);
    const batchEmbedding: any = await openaiObj().embeddings.create({
      model: "text-embedding-ada-002",
      input: batch,
    });
    batchEmbedding.data.map((embeddingData: any, index: number) => {
      const id = uuidv4();
      dataIDs.push(id);
      /// storing in response data
      data.push({
        metadata: { content: chunks[index], source, filename, chatbotId },
        values: embeddingData.embedding,
        id: id,
      });

      tempData.push({
        metadata: { content: chunks[index], source, filename, chatbotId },
        values: embeddingData.embedding,
        id: id,
      });
    });

    /// currently being used to upsert on files data
    if (userId != "") {
      await upsert(tempData, userId);
    }
  }

  return { data, dataIDs, contentLength };
}

export async function createEmbedding(query: string) {
  const batchEmbedding: any = await openaiObj().embeddings.create({
    model: "text-embedding-ada-002",
    input: query,
  });

  return batchEmbedding.data[0].embedding;
}
