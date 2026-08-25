/**
 * Breaks the retrieved FloatCo chunks into categories so "noise" is a number,
 * not an impression. Also corrects 02-replay's image count, whose regex required
 * an exact whitespace pattern and therefore undercounted.
 *
 *   node evals-crawler/06-chunk-composition.js
 */

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });
const { MongoClient } = require("mongodb");
const { Pinecone } = require("@pinecone-database/pinecone");
const { OpenAIEmbeddings } = require("@langchain/openai");

const QUERIES = [
  "how much is a float session",
  "what are your opening hours",
  "do you have a cold plunge",
];

(async () => {
  const mongo = new MongoClient(process.env.NEXT_PUBLIC_MONGO_URI);
  await mongo.connect();
  const db = mongo.db();
  const doc = await db.collection("chatbots-data").findOne({
    source: "crawling",
    "content.crawlLink": { $regex: "floatco", $options: "i" },
  });
  const bot = await db.collection("user-chatbots").findOne({ chatbotId: doc.chatbotId });

  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: (process.env.NEXT_PUBLIC_OPENAI_KEY || "").trim(),
    modelName: "text-embedding-ada-002",
  });
  const pc = new Pinecone({ apiKey: (process.env.NEXT_PUBLIC_PINECONE_KEY || "").trim() });
  const index = pc.index((process.env.NEXT_PUBLIC_PINECONE_INDEX || "").trim());

  const seen = new Map();
  let totals = { chars: 0, image: 0, chunks: 0 };

  for (const q of QUERIES) {
    const vector = await embeddings.embedQuery(q);
    const res = await index.namespace(String(bot.userId)).query({
      vector, topK: 3, includeMetadata: true, filter: { chatbotId: doc.chatbotId },
    });

    console.log(`\nquery: "${q}"`);
    const texts = [];
    for (const m of res.matches || []) {
      const t = String(m.metadata?.content || "");
      texts.push(t);

      // count every image marker, whatever the surrounding whitespace
      const urls = t.match(/image:\s*https?:\/\/\S+/g) || [];
      const imageChars = urls.reduce((a, s) => a + s.length, 0);

      totals.chars += t.length;
      totals.image += imageChars;
      totals.chunks++;

      const key = t.slice(0, 120);
      seen.set(key, (seen.get(key) || 0) + 1);

      console.log(
        `  score ${m.score.toFixed(4)}  ${t.length} chars  ` +
          `${urls.length} image URLs = ${imageChars} chars (${((imageChars / t.length) * 100).toFixed(1)}%)`
      );
    }

    const uniq = new Set(texts).size;
    console.log(`  distinct chunks returned: ${uniq} of ${texts.length}`);
  }

  console.log("\n" + "=".repeat(66));
  console.log(`chunks examined        ${totals.chunks}`);
  console.log(`total chars            ${totals.chars}`);
  console.log(
    `image URL chars        ${totals.image}  (${((totals.image / totals.chars) * 100).toFixed(1)}% of retrieved context)`
  );
  const dupChunks = [...seen.values()].filter((v) => v > 1).length;
  console.log(`chunk texts seen more than once: ${dupChunks}`);
  console.log("=".repeat(66));

  await mongo.close();
})().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(1);
});
