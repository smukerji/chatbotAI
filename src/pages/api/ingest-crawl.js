/**
 * Lightweight crawl-only ingest — embeds crawled pages without full store-v2.
 * POST JSON: { userId, chatbotId, crawledList, updateChatbot?: true }
 */
import { v4 as uuid } from "uuid";
import clientPromise from "../../db";
import {
  generateChunksNEmbeddForLinks,
} from "../../app/_helpers/server/embeddings";
import { collectSiteFactsFromCrawl } from "../../app/_helpers/server/site-facts";

export const maxDuration = 300;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { userId, chatbotId, crawledList, updateChatbot = true } = req.body || {};

    if (!userId || !chatbotId || !Array.isArray(crawledList) || !crawledList.length) {
      return res.status(400).json({
        error: "userId, chatbotId, and non-empty crawledList are required",
      });
    }

    const db = (await clientPromise).db();
    const collection = db.collection("chatbots-data");

    const dbCrawlSource = [];
    let crwaledLinkUpsertData = crawledList.map((obj) => {
      const tempIds = [];
      const tempData = [];
      obj.cleanedText?.forEach((element) => {
        const id = uuid();
        tempData.push({
          element,
          id,
          link: obj?.crawlLink,
          pageText: obj?.pageText,
        });
        tempIds.push(id);
      });

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

    const chunkCount = crwaledLinkUpsertData.length;
    console.log(
      `[ingest-crawl] ${chunkCount} chunks, ${crawledList.length} pages, bot=${chatbotId}`
    );

    const t0 = Date.now();
    const siteFacts = collectSiteFactsFromCrawl(crawledList);
    await generateChunksNEmbeddForLinks(
      crwaledLinkUpsertData,
      "crawling",
      chatbotId,
      userId,
      "none",
      siteFacts
    );

    if (updateChatbot) {
      const previousLinksContent = await collection.findOne({
        chatbotId,
        source: "crawling",
      });
      await collection.findOneAndUpdate(
        { chatbotId, source: "crawling" },
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
    } else {
      await collection.insertOne({
        chatbotId,
        content: dbCrawlSource,
        source: "crawling",
      });
    }

    await db.collection("chatbot-settings").updateOne(
      { userId, chatbotId },
      { $set: { lastTrained: Date.now() } }
    );

    return res.status(200).json({
      ok: true,
      pages: crawledList.length,
      chunks: chunkCount,
      elapsedMs: Date.now() - t0,
    });
  } catch (error) {
    console.error("[ingest-crawl] failed:", error);
    return res.status(500).json({
      error: error?.message || "ingest failed",
    });
  }
}
