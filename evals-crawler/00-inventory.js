/**
 * Inventory of what is actually stored from crawling, straight from Mongo.
 * Read-only. Tells us which URLs to replay through the extractor and what the
 * production pipeline stored for them, so fresh output can be diffed against it.
 *
 *   node evals-crawler/00-inventory.js
 */

const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });
const { MongoClient } = require("mongodb");

const OUT = path.join(__dirname, "results");

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const client = new MongoClient(process.env.NEXT_PUBLIC_MONGO_URI);
  await client.connect();
  const db = client.db();

  const docs = await db
    .collection("chatbots-data")
    .find({ source: "crawling" })
    .toArray();

  console.log(`crawling docs: ${docs.length}`);

  const pages = [];
  for (const d of docs) {
    const content = Array.isArray(d.content) ? d.content : [];
    for (const c of content) {
      const chunks = Array.isArray(c.cleanedText) ? c.cleanedText : [];
      pages.push({
        chatbotId: d.chatbotId,
        url: c.crawlLink,
        charCount: c.charCount ?? null,
        storedChunks: chunks.length,
        storedChars: chunks.join("").length,
        firstChunk: (chunks[0] || "").slice(0, 400),
      });
    }
  }

  pages.sort((a, b) => (b.charCount || 0) - (a.charCount || 0));

  console.log(`pages stored: ${pages.length}`);
  console.log(`bots: ${new Set(pages.map((p) => p.chatbotId)).size}`);
  console.log("\nsize distribution (charCount):");
  const sizes = pages.map((p) => p.charCount || 0).filter(Boolean);
  if (sizes.length) {
    const q = (f) => sizes[Math.floor((sizes.length - 1) * f)];
    console.log(
      `  max ${q(0)}  p75 ${q(0.25)}  median ${q(0.5)}  p25 ${q(0.75)}  min ${q(1)}`
    );
  }

  console.log("\ntop 15 by size:");
  for (const p of pages.slice(0, 15)) {
    console.log(
      `  ${String(p.charCount).padStart(7)}  ${String(p.storedChunks).padStart(3)} chunks  ${p.url}`
    );
  }

  fs.writeFileSync(
    path.join(OUT, "inventory.json"),
    JSON.stringify(pages, null, 2)
  );
  console.log(`\n-> ${path.join(OUT, "inventory.json")}`);

  await client.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
