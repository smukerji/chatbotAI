/**
 * Re-fetch crawled URLs for a chatbot, extract site facts from raw HTML,
 * and upsert hybrid site_fact vectors. General — not site-specific.
 *
 * Usage:
 *   node scripts/backfill-site-facts.mjs
 *
 * Env:
 *   NEXT_PUBLIC_PINECONE_KEY
 *   NEXT_PUBLIC_PINECONE_HYBRID_INDEX=luciferai-hybrid
 *   NEXT_PUBLIC_OPENAI_KEY
 *   NEXT_PUBLIC_MONGO_URI
 *   BACKFILL_USER_ID=...
 *   BACKFILL_CHATBOT_ID=...
 *   BACKFILL_MAX_URLS=40          (optional)
 *   BACKFILL_CONCURRENCY=3       (optional)
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { MongoClient } from "mongodb";
import { Pinecone } from "@pinecone-database/pinecone";
import OpenAI from "openai";
import { chromium } from "playwright";
import { embedSparseTexts } from "./lib/pinecone-sparse.mjs";
import {
  dedupeSiteFacts,
  extractSiteFactsFromHtml,
  formatSiteFactEmbedText,
  siteFactVectorId,
} from "./lib/site-facts.mjs";

const pineconeKey = process.env.NEXT_PUBLIC_PINECONE_KEY?.trim();
const hybridIndexName =
  process.env.NEXT_PUBLIC_PINECONE_HYBRID_INDEX?.trim() || "luciferai-hybrid";
const openaiKey = process.env.NEXT_PUBLIC_OPENAI_KEY?.trim();
const mongoUri = process.env.NEXT_PUBLIC_MONGO_URI;
const userId = process.env.BACKFILL_USER_ID?.trim();
const chatbotId = process.env.BACKFILL_CHATBOT_ID?.trim();
const maxUrls = Number(process.env.BACKFILL_MAX_URLS || 40);
const urlFilter = (process.env.BACKFILL_URL_FILTER || "").trim().toLowerCase();
const concurrency = Math.max(1, Number(process.env.BACKFILL_CONCURRENCY || 3));
const sparseModel =
  process.env.PINECONE_SPARSE_MODEL?.trim() || "pinecone-sparse-english-v0";

if (!pineconeKey || !openaiKey || !mongoUri) {
  console.error("Missing NEXT_PUBLIC_PINECONE_KEY / OPENAI_KEY / MONGO_URI");
  process.exit(1);
}
if (!userId || !chatbotId) {
  console.error("Set BACKFILL_USER_ID and BACKFILL_CHATBOT_ID");
  process.exit(1);
}

function collectUrls(docs) {
  const urls = [];
  const seen = new Set();
  for (const doc of docs) {
    if (!Array.isArray(doc.content)) continue;
    for (const page of doc.content) {
      const url = page?.crawlLink;
      if (!url || typeof url !== "string") continue;
      if (!/^https?:\/\//i.test(url)) continue;
      const key = url.replace(/\/$/, "").toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      urls.push(url);
    }
  }
  return urls;
}

async function fetchHtml(browser, url) {
  const page = await browser.newPage();
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 25000 });
    return await page.$eval("body", (body) => body.innerHTML);
  } finally {
    await page.close().catch(() => {});
  }
}

async function mapPool(items, limit, fn) {
  const results = [];
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx], idx);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => worker())
  );
  return results;
}

const mongo = new MongoClient(mongoUri);
await mongo.connect();
const docs = await mongo
  .db()
  .collection("chatbots-data")
  .find({ chatbotId, source: "crawling" })
  .toArray();
await mongo.close();

const urls = collectUrls(docs)
  .filter((u) => (urlFilter ? u.toLowerCase().includes(urlFilter) : true))
  .slice(0, maxUrls);
console.log(
  `URLs to scan: ${urls.length} (chatbot=${chatbotId}${urlFilter ? `, filter=${urlFilter}` : ""})`
);

if (!urls.length) {
  console.error("No crawl URLs found for chatbot");
  process.exit(1);
}

const browser = await chromium.launch({ headless: true });
const allFacts = [];
let failures = 0;

await mapPool(urls, concurrency, async (url, idx) => {
  try {
    const html = await fetchHtml(browser, url);
    const facts = extractSiteFactsFromHtml(html, url);
    allFacts.push(...facts);
    console.log(`[${idx + 1}/${urls.length}] ${url} -> ${facts.length} facts`);
  } catch (err) {
    failures++;
    console.warn(`[${idx + 1}/${urls.length}] FAIL ${url}:`, err?.message || err);
  }
});

await browser.close();

const unique = dedupeSiteFacts(allFacts);
console.log(
  `Unique site facts: ${unique.length} (from ${allFacts.length} raw, ${failures} fetch failures)`
);
for (const f of unique.slice(0, 30)) {
  console.log(`  - [${f.type}] ${f.value} (${f.sourceUrl})`);
}

if (!unique.length) {
  console.log("Nothing to upsert");
  process.exit(0);
}

const openai = new OpenAI({ apiKey: openaiKey });
const pc = new Pinecone({ apiKey: pineconeKey });
const index = pc.index(hybridIndexName);
const ns = index.namespace(userId);

const BATCH = 32;
for (let i = 0; i < unique.length; i += BATCH) {
  const batch = unique.slice(i, i + BATCH);
  const texts = batch.map(formatSiteFactEmbedText);
  const dense = (
    await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: texts,
    })
  ).data.map((d) => d.embedding);
  const sparse = await embedSparseTexts({
    apiKey: pineconeKey,
    model: sparseModel,
    texts,
    inputType: "passage",
  });

  const vectors = batch.map((fact, j) => ({
    id: siteFactVectorId(chatbotId, fact),
    values: dense[j],
    sparseValues: {
      indices: sparse[j].indices,
      values: sparse[j].values,
    },
    metadata: {
      content: texts[j],
      source: "crawling",
      link: fact.sourceUrl,
      filename: "site_facts",
      chatbotId,
      chunk_type: "site_fact",
      fact_type: fact.type,
      fact_value: fact.value,
    },
  }));

  await ns.upsert(vectors);
  console.log(`Upserted ${i + vectors.length}/${unique.length}`);
}

console.log("Done.");
