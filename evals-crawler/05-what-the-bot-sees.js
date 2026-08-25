/**
 * Prints the real chunks stored in Pinecone for a crawled bot - i.e. exactly
 * what retrieval can return and what the model gets handed as context.
 *
 *   node evals-crawler/05-what-the-bot-sees.js "how much is a float session"
 */

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });
const { MongoClient } = require("mongodb");
const { Pinecone } = require("@pinecone-database/pinecone");
const { OpenAIEmbeddings } = require("@langchain/openai");

(async () => {
  const query = process.argv[2] || "how much is a float session";

  const mongo = new MongoClient(process.env.NEXT_PUBLIC_MONGO_URI);
  await mongo.connect();
  const db = mongo.db();

  // find the FloatCo bot from the crawl records
  const doc = await db.collection("chatbots-data").findOne({
    source: "crawling",
    "content.crawlLink": { $regex: "floatco", $options: "i" },
  });
  if (!doc) throw new Error("no floatco crawl doc found");

  // chatbotId is a uuid string; the owner lives in user-chatbots
  const bot = await db.collection("user-chatbots").findOne({ chatbotId: doc.chatbotId });
  if (!bot) throw new Error(`no user-chatbots record for ${doc.chatbotId}`);
  const userId = bot.userId;
  console.log(`bot       : ${bot.chatbotName}`);

  console.log(`chatbotId : ${doc.chatbotId}`);
  console.log(`namespace : ${userId}`);
  console.log(`query     : "${query}"\n`);

  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: (process.env.NEXT_PUBLIC_OPENAI_KEY || "").trim(),
    modelName: "text-embedding-ada-002",
  });
  const vector = await embeddings.embedQuery(query);

  const pc = new Pinecone({ apiKey: (process.env.NEXT_PUBLIC_PINECONE_KEY || "").trim() });
  const index = pc.index((process.env.NEXT_PUBLIC_PINECONE_INDEX || "").trim());

  const res = await index.namespace(String(userId)).query({
    vector,
    topK: 3,
    includeMetadata: true,
    filter: { chatbotId: doc.chatbotId },
  });

  console.log("=".repeat(78));
  console.log("WHAT RETRIEVAL RETURNS - the exact text handed to the model");
  console.log("=".repeat(78));

  for (const [i, m] of (res.matches || []).entries()) {
    const content = String(m.metadata?.content || "");
    console.log(`\n--- match ${i + 1}  score ${m.score?.toFixed(4)}  ${content.length} chars ---`);
    console.log(content);
    console.log(`--- end match ${i + 1} ---`);
  }

  await mongo.close();
})().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(1);
});
