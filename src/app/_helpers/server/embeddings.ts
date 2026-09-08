import { OpenAI } from "openai";

import { v4 as uuidv4 } from "uuid";

import { upsert } from "./pinecone";

import { contextualizeChunks, prependContextToCrawlChunks, buildDoclingDocumentAnchor } from "./contextualize-chunks";

import { buildIngestVectors } from "./ingest-vectors";

import { isHybridSearchEnabled } from "./hybrid-config";
import { appendPageStatChunks } from "./stat-chunks";
import {
  collectSiteFactsFromCrawl,
  dedupeSiteFacts,
  formatSiteFactEmbedText,
  siteFactVectorId,
  type SiteFact,
} from "./site-facts";

export async function upsertSiteFacts(
  facts: SiteFact[],
  chatbotId: string,
  userId: string,
  source: string = "crawling"
): Promise<number> {
  const unique = dedupeSiteFacts(facts);
  if (!unique.length) return 0;

  const batchSize = 150;
  let upserted = 0;

  for (let i = 0; i < unique.length; i += batchSize) {
    const batch = unique.slice(i, i + batchSize);
    const texts = batch.map(formatSiteFactEmbedText);
    const ids = batch.map((f) => siteFactVectorId(chatbotId, f));
    const vectors = await buildIngestVectors({
      denseTexts: texts,
      sparseTexts: texts,
      ids,
      metadataList: batch.map((fact, index) => ({
        content: texts[index],
        source,
        link: fact.sourceUrl,
        filename: "site_facts",
        chatbotId,
        chunk_type: "site_fact",
        fact_type: fact.type,
        fact_value: fact.value,
      })),
    });
    await upsert(vectors, userId);
    upserted += vectors.length;
  }

  console.log(
    `[ingest] upserted ${upserted} site_fact vectors for chatbot ${chatbotId}`
  );
  return upserted;
}



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

  filename: string = "none",

  siteFacts: SiteFact[] = []

) {

  const t0 = Date.now();

  console.log(

    `[ingest] starting link embeddings: ${crwaledLinkUpsertData.length} chunks for chatbot ${chatbotId} (hybrid=${isHybridSearchEnabled()})`

  );

  const contextualizedItems = appendPageStatChunks(
    await prependContextToCrawlChunks(crwaledLinkUpsertData)
  );

  const crawlEmbed = contextualizedItems.map(

    (item) => item.embedText ?? item.element

  );

  const crawlContent = contextualizedItems.map((item) => item.element);

  const crawlDataId = contextualizedItems.map((item) => {

    return { id: item.id, link: item.link, isStatChunk: item.isStatChunk };

  });

  /// creating chunks with batch size 250

  const batchSize = 150;

  /// creating embeddings

  for (let i = 0; i < crawlEmbed.length; i += batchSize) {

    const batch = crawlEmbed.slice(i, i + batchSize);

    const batchContent = crawlContent.slice(i, i + batchSize);

    const batchId = crawlDataId.slice(i, i + batchSize);



    try {

      const upsertData = await buildIngestVectors({

        denseTexts: batch,

        sparseTexts: batchContent,

        ids: batchId.map((item) => item.id),

        metadataList: batchContent.map((content, index) => ({
          content,
          source,
          link: batchId[index]?.link,
          filename,
          chatbotId,
          chunk_type: batchId[index]?.isStatChunk ? "page_stat" : "page",
        })),

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

  const factsFromChunks = collectSiteFactsFromCrawl(crwaledLinkUpsertData);
  const mergedFacts = dedupeSiteFacts([...(siteFacts || []), ...factsFromChunks]);
  if (mergedFacts.length) {
    await upsertSiteFacts(mergedFacts, chatbotId, userId, source);
  }

  console.log(

    `[ingest] finished link embeddings: ${crawlEmbed.length} chunks in ${Date.now() - t0}ms`

  );

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

    const batch = chunks.slice(i, i + batchSize);

    const ids = batch.map(() => uuidv4());

    const tempData = await buildIngestVectors({

      denseTexts: batch,

      sparseTexts: batch,

      ids,

      metadataList: batch.map((chunk: string) => ({

        content: chunk,

        source,

        filename,

        chatbotId,

      })),

    });



    dataIDs.push(...ids);

    data.push(...tempData);



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



  const contextualized = await contextualizeChunks(content, chunks);



  /// creating chunks with batch size 2000

  const batchSize = 250;

  let data: any = [];

  let dataIDs: any = [];

  /// creating embeddings

  for (let i = 0; i < contextualized.length; i += batchSize) {

    const batch = contextualized.slice(i, i + batchSize);

    const ids = batch.map(() => uuidv4());

    const tempData = await buildIngestVectors({

      denseTexts: batch.map((item) => item.embed),

      sparseTexts: batch.map((item) => item.raw),

      ids,

      metadataList: batch.map((item) => ({

        content: item.raw,

        source,

        filename,

        chatbotId,

      })),

    });



    dataIDs.push(...ids);

    data.push(...tempData);



    /// currently being used to upsert on files data

    if (userId != "") {

      await upsert(tempData, userId);

    }

  }



  return { data, dataIDs, contentLength };

}



export async function generateChunksNEmbeddViaDocling(

  content: any,

  source: string,

  chatbotId: string,

  userId: string,

  filename: string = "none"

) {

  /// extract all the chunks of text / table / image

  const { chunks, chunksMetadata, contentLength }: any = await extractChunks(

    content,

    0

  );



  const documentAnchor = buildDoclingDocumentAnchor(chunks);

  const contextualized = await contextualizeChunks(documentAnchor, chunks);



  /// creating chunks with batch size 2000

  const batchSize = 250;

  let data: any = [];

  let dataIDs: any = [];

  /// creating embeddings

  for (let i = 0; i < contextualized.length; i += batchSize) {

    const batch = contextualized.slice(i, i + batchSize);

    const batchMetadata = chunksMetadata.slice(i, i + batchSize);

    const ids = batch.map(() => uuidv4());

    const tempData = await buildIngestVectors({

      denseTexts: batch.map((item) => item.embed),

      sparseTexts: batch.map((item) => item.raw),

      ids,

      metadataList: batch.map((item, index) => {

        const mergedMetadata = {

          content: item.raw,

          source,

          filename,

          chatbotId,

          source_url: batchMetadata[index]?.source_url || "",

          dimensions: batchMetadata[index]?.dimensions || null,

          type: batchMetadata[index]?.type || "unknown",

          ...(batchMetadata[index]?.image_path && {

            image_path: batchMetadata[index].image_path,

          }),

        };

        return mergedMetadata;

      }),

    });



    dataIDs.push(...ids);

    data.push(...tempData);



    /// currently being used to upsert on files data

    if (userId != "") {

      await upsert(tempData, userId);

    }

  }



  return { data, dataIDs, contentLength };

}



interface DocumentContent {

  texts?: Array<{

    id: number;

    source: string;

    content: string;

    dimensions: any;

    source_url: string;

  }>;

  tables?: Array<{

    id: number;

    source: string;

    content: string;

    source_url: string;

    dimensions: any;

  }>;

  pictures?: Array<{

    id: number;

    source: string;

    content: string;

    image_path: string;

    dimensions: any;

    source_url: string;

  }>;

}



async function extractChunks(content: DocumentContent, contentLength: number) {

  const chunks: string[] = [];

  const chunksMetadata: any[] = [];



  // Extract content from texts

  if (content?.texts) {

    content.texts.forEach((text) => {

      if (text.content) {

        chunks.push(text.content);

        chunksMetadata.push({

          source_url: text.source_url || "",

          dimensions: text.dimensions ? JSON.stringify(text.dimensions) : null,

          type: "text",

        });

        contentLength += text.content.length;

      }

    });

  }



  // Extract content from tables

  if (content?.tables) {

    content.tables.forEach((table) => {

      if (table.content) {

        chunks.push(table.content);

        chunksMetadata.push({

          source_url: table.source_url || "",

          dimensions: table.dimensions

            ? JSON.stringify(table.dimensions)

            : null,

          type: "table",

        });

        contentLength += table.content.length;

      }

    });

  }



  // Extract content from pictures

  if (content?.pictures) {

    content.pictures.forEach((picture) => {

      if (picture.content) {

        /// add picture content + image path

        chunks.push(picture.content + " image: " + picture?.image_path);

        chunksMetadata.push({

          source_url: picture.source_url || "",

          dimensions: picture.dimensions

            ? JSON.stringify(picture.dimensions)

            : null,

          type: "picture",

          image_path: picture.image_path,

        });

        contentLength += picture.content.length + picture?.image_path.length;

      }

    });

  }



  return { chunks, chunksMetadata, contentLength };

}



export async function createEmbedding(query: string) {

  const batchEmbedding: any = await openaiObj().embeddings.create({

    model: "text-embedding-ada-002",

    input: query,

  });



  return batchEmbedding.data[0].embedding;

}


