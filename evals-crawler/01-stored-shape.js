/**
 * What does the crawl pipeline actually persist? Prints the real key names and
 * a sample of stored text, so the replay harness compares like with like.
 *
 *   node evals-crawler/01-stored-shape.js
 */

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });
const { MongoClient } = require("mongodb");

(async () => {
  const client = new MongoClient(process.env.NEXT_PUBLIC_MONGO_URI);
  await client.connect();
  const db = client.db();

  const doc = await db
    .collection("chatbots-data")
    .findOne({ source: "crawling" });

  console.log("doc keys:", Object.keys(doc));
  console.log("content is array:", Array.isArray(doc.content), "len:", doc.content?.length);

  const item = doc.content?.[0];
  console.log("\ncontent[0] keys:", Object.keys(item || {}));
  for (const [k, v] of Object.entries(item || {})) {
    const t = Array.isArray(v) ? `array(${v.length})` : typeof v;
    const preview =
      typeof v === "string" ? JSON.stringify(v.slice(0, 200)) : Array.isArray(v) ? JSON.stringify(String(v[0]).slice(0, 200)) : v;
    console.log(`  ${k}: ${t} = ${preview}`);
  }

  // what actually got embedded lives in Pinecone metadata.content; the mongo doc
  // is the source of truth for what the crawler produced
  console.log("\n--- duplicate / near-duplicate URLs across all crawl docs ---");
  const all = await db.collection("chatbots-data").find({ source: "crawling" }).toArray();
  const seen = new Map();
  for (const d of all) {
    for (const c of d.content || []) {
      const norm = String(c.crawlLink || "").replace(/\/$/, "").toLowerCase();
      if (!seen.has(norm)) seen.set(norm, []);
      seen.get(norm).push(c.crawlLink);
    }
  }
  let dupes = 0;
  for (const [norm, urls] of seen) {
    if (urls.length > 1) {
      dupes++;
      if (dupes <= 10) console.log(`  x${urls.length}  ${norm}`);
    }
  }
  console.log(`  total URLs that collapse to a duplicate: ${dupes}`);

  await client.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
