import { OpenAI } from "openai";

import { v4 as uuidv4 } from "uuid";

import { upsert, deleteDocFactsForFile } from "./pinecone";

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
import {
  dedupeDocFacts,
  docFactVectorId,
  extractDocumentFactsFromChunks,
  formatDocFactEmbedText,
  assignSectionRoles,
  inferSectionRole,
  isLikelyDocChromeChunk,
  metaToStampFields,
  type DocFact,
  type DocFactType,
} from "./doc-facts";
import {
  buildStructuredTextChunks,
  type DoclingTextItem,
} from "./doc-structure";
import {
  collectTypedRelationsFromPictures,
  describePictureForIndex,
  relationsToFacts,
  resolvePictureImage,
  type PictureForRelations,
} from "./doc-relations";

export async function upsertDocFacts(
  facts: DocFact[],
  chatbotId: string,
  userId: string,
  source: string = "file",
  filename: string = "document"
): Promise<{ upserted: number; ids: string[] }> {
  const unique = dedupeDocFacts(facts);
  if (!unique.length) return { upserted: 0, ids: [] };

  const batchSize = 150;
  let upserted = 0;
  const allIds: string[] = [];

  for (let i = 0; i < unique.length; i += batchSize) {
    const batch = unique.slice(i, i + batchSize);
    const texts = batch.map(formatDocFactEmbedText);
    const ids = batch.map((f) => docFactVectorId(chatbotId, f));
    const vectors = await buildIngestVectors({
      denseTexts: texts,
      sparseTexts: texts,
      ids,
      metadataList: batch.map((fact, index) => ({
        content: texts[index],
        source,
        filename: fact.filename || filename,
        chatbotId,
        chunk_type: "doc_fact",
        fact_type: fact.type,
        fact_value: fact.value,
        section_role: "body",
      })),
    });
    await upsert(vectors, userId);
    upserted += vectors.length;
    allIds.push(...ids);
  }

  console.log(
    `[ingest] upserted ${upserted} doc_fact vectors for chatbot ${chatbotId} file=${filename}`
  );
  return { upserted, ids: allIds };
}

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

  /// Enrich empty Docling pictures with vision captions + keep public image URLs
  if (Array.isArray(content?.pictures) && content.pictures.length) {
    for (const picture of content.pictures) {
      if (!picture) continue;
      const hasText = String(picture.content || picture.caption || "").trim();
      if (hasText) continue;
      try {
        const resolved = await resolvePictureImage({
          image_path: picture.image_path,
          source_url: picture.source_url,
        });
        if (!resolved) continue;
        const caption = await describePictureForIndex({
          ...resolved,
          filename,
        });
        if (caption) {
          picture.content = caption;
          picture.caption = caption;
        }
      } catch (err) {
        console.warn(
          "[ingest] picture caption failed:",
          (err as Error)?.message || err
        );
      }
    }
  }

  /// extract all the chunks of text / table / image

  const extracted: any = await extractChunks(

    content,

    0

  );

  let chunks: string[] = extracted.chunks || [];
  let chunksMetadata: any[] = extracted.chunksMetadata || [];
  let contentLength: number = extracted.contentLength || 0;

  const { meta, facts: identityFacts } = await extractDocumentFactsFromChunks(
    chunks,
    filename
  );

  /// Phase-1 hierarchy: merge gated vision edges into org_* facts (text already in identityFacts)
  const pictureInputs: PictureForRelations[] = (
    Array.isArray(content?.pictures) ? content.pictures : []
  ).map((picture: any) => {
    const metaRow = chunksMetadata.find(
      (m) =>
        m?.element_type === "picture" &&
        m?.image_path &&
        m.image_path === picture?.image_path
    );
    return {
      content: picture?.content,
      caption: picture?.caption || picture?.label,
      image_path: picture?.image_path,
      source_url: picture?.source_url,
      heading_path:
        metaRow?.heading_path ||
        picture?.heading_path ||
        picture?.heading ||
        (Array.isArray(picture?.headings)
          ? picture.headings.join(" > ")
          : picture?.headings) ||
        "",
      headings: picture?.headings || picture?.heading,
    };
  });
  let visionOrgFacts: DocFact[] = [];
  try {
    const visionRels = await collectTypedRelationsFromPictures(
      pictureInputs,
      filename
    );
    visionOrgFacts = relationsToFacts(visionRels, filename).map((f) => ({
      type: f.type as DocFactType,
      label: f.label,
      value: f.value,
      normalized: f.normalized,
      filename: f.filename,
    }));
  } catch (err) {
    console.warn(
      "[ingest] vision relation extract failed:",
      (err as Error)?.message || err
    );
  }
  const facts = dedupeDocFacts([...identityFacts, ...visionOrgFacts]);
  const stamp = metaToStampFields(meta);

  /// Drop repeating masthead chrome from body index (facts kept via doc_fact)
  const headingPaths = chunksMetadata.map((m) => String(m?.heading_path || ""));
  const sectionRoles = assignSectionRoles(chunks, headingPaths);
  const keptChunks: string[] = [];
  const keptMeta: any[] = [];
  for (let i = 0; i < chunks.length; i++) {
    const raw = chunks[i];
    const role = sectionRoles[i] || "body";
    if (role !== "references" && isLikelyDocChromeChunk(raw, meta)) {
      continue;
    }
    keptChunks.push(raw);
    keptMeta.push({
      ...chunksMetadata[i],
      section_role:
        role === "body" && isLikelyDocChromeChunk(raw, meta) ? "chrome" : role,
    });
  }
  chunks = keptChunks;
  chunksMetadata = keptMeta;
  contentLength = chunks.reduce((n, c) => n + (c?.length || 0), 0);

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

      denseTexts: batch.map((item, index) => {
        const hp = String(batchMetadata[index]?.heading_path || "").trim();
        return hp ? `${hp}\n\n${item.embed}` : item.embed;
      }),

      sparseTexts: batch.map((item, index) => {
        const hp = String(batchMetadata[index]?.heading_path || "").trim();
        return hp ? `${hp}\n${item.raw}` : item.raw;
      }),

      ids,

      metadataList: batch.map((item, index) => {

        const sectionRole =
          batchMetadata[index]?.section_role ||
          inferSectionRole(item.raw);

        const mergedMetadata = {

          content: item.raw,

          source,

          filename,

          chatbotId,

          source_url: batchMetadata[index]?.source_url || "",

          dimensions: batchMetadata[index]?.dimensions || null,

          type: batchMetadata[index]?.type || "unknown",

          element_type: batchMetadata[index]?.element_type || batchMetadata[index]?.type || "unknown",

          heading_path: batchMetadata[index]?.heading_path || "",

          chunk_type: "file",

          section_role: sectionRole,

          ...stamp,

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

  if (userId) {
    await deleteDocFactsForFile(userId, filename, chatbotId);
    if (facts.length) {
      const factUpsert = await upsertDocFacts(
        facts,
        chatbotId,
        userId,
        source,
        filename
      );
      dataIDs.push(...factUpsert.ids);
    }
  }

  console.log(
    `[ingest] docling file=${filename} chunks=${contextualized.length} doc_facts=${facts.length} paper_id=${meta.paperId || "-"} publication=${meta.volume && meta.issue ? `Vol ${meta.volume} Issue ${meta.issue} ${meta.year || ""}` : "-"}`
  );

  return { data, dataIDs, contentLength, meta, facts };

}



interface DocumentContent {
  texts?: DoclingTextItem[];
  tables?: Array<{
    id?: number;
    source?: string;
    content?: string;
    source_url?: string;
    dimensions?: {
      quarantine?: boolean;
      quality?: string;
      [key: string]: unknown;
    } | null;
    quality?: string;
    quarantine?: boolean;
    type?: string;
    label?: string;
    headings?: string[] | string;
    heading?: string;
  }>;
  pictures?: Array<{
    id?: number;
    source?: string;
    content?: string;
    caption?: string;
    label?: string;
    image_path?: string;
    dimensions?: unknown;
    source_url?: string;
    heading?: string;
    headings?: string[] | string;
    heading_path?: string;
  }>;
}

async function extractChunks(content: DocumentContent, contentLength: number) {
  const chunks: string[] = [];
  const chunksMetadata: any[] = [];

  /// Texts: preserve section_header / headings from process-doc when present;
  /// otherwise infer heading_path from sequential short headers.
  const structured = buildStructuredTextChunks(content?.texts);
  for (const row of structured) {
    chunks.push(row.content);
    chunksMetadata.push(row.meta);
    contentLength += row.content.length;
  }

  let lastHeadingPath =
    chunksMetadata.length > 0
      ? String(chunksMetadata[chunksMetadata.length - 1].heading_path || "")
      : "";

    if (content?.tables) {
    content.tables.forEach((table) => {
      if (!table.content) return;
      const quarantined =
        table.quarantine === true ||
        table.dimensions?.quarantine === true ||
        table.quality === "empty" ||
        table.quality === "truncated" ||
        table.dimensions?.quality === "empty" ||
        table.dimensions?.quality === "truncated";
      if (quarantined) {
        console.warn(
          "[embeddings] Skipping quarantined table chunk",
          table.id,
          table.quality || table.dimensions?.quality
        );
        return;
      }
      const path =
        (Array.isArray(table.headings) && table.headings.length
          ? table.headings.join(" > ")
          : typeof table.headings === "string"
            ? table.headings
            : table.heading) || lastHeadingPath;
      chunks.push(table.content);
      chunksMetadata.push({
        source_url: table.source_url || "",
        dimensions: table.dimensions ? JSON.stringify(table.dimensions) : null,
        type: "table",
        element_type: "table",
        heading_path: path,
        is_section_header: false,
        quality: table.quality || table.dimensions?.quality || "ok",
      });
      contentLength += table.content.length;
    });
  }

  if (content?.pictures) {
    content.pictures.forEach((picture) => {
      if (!picture.content && !picture.image_path) return;
      const picContent = String(picture.content || "");
      const path =
        (picture as { heading?: string; headings?: string[] | string })
          .heading ||
        (Array.isArray((picture as any).headings) &&
        (picture as any).headings.length
          ? (picture as any).headings.join(" > ")
          : typeof (picture as any).headings === "string"
            ? (picture as any).headings
            : "") ||
        lastHeadingPath;
      chunks.push(
        picContent
          ? picContent + (picture?.image_path ? " image: " + picture.image_path : "")
          : `image: ${picture?.image_path || ""}`
      );
      chunksMetadata.push({
        source_url: picture.source_url || "",
        dimensions: picture.dimensions
          ? JSON.stringify(picture.dimensions)
          : null,
        type: "picture",
        element_type: "picture",
        heading_path: path,
        is_section_header: false,
        image_path: picture.image_path,
      });
      contentLength +=
        picContent.length + (picture?.image_path?.length || 0);
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


