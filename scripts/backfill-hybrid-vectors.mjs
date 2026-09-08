/**
 * Backfill hybrid vectors for one bot: fetch chunk text from the legacy dense
 * index, generate sparse vectors, and upsert dense+sparse into the hybrid index.
 *
 * Usage:
 *   node scripts/backfill-hybrid-vectors.mjs
 *
 * Env:
 *   NEXT_PUBLIC_PINECONE_KEY
 *   NEXT_PUBLIC_PINECONE_INDEX=luciferai-test
 *   NEXT_PUBLIC_PINECONE_HYBRID_INDEX=luciferai-hybrid
 *   NEXT_PUBLIC_OPENAI_KEY
 *   NEXT_PUBLIC_MONGO_URI
 *   BACKFILL_USER_ID=...
 *   BACKFILL_CHATBOT_ID=...
 */
import dotenv from "dotenv";
import { MongoClient } from "mongodb";
import { Pinecone } from "@pinecone-database/pinecone";
import OpenAI from "openai";
import { embedSparseTexts } from "./lib/pinecone-sparse.mjs";

dotenv.config({ path: ".env.local" });

const pineconeKey = process.env.NEXT_PUBLIC_PINECONE_KEY?.trim();
const sourceIndexName = process.env.NEXT_PUBLIC_PINECONE_INDEX?.trim();
const hybridIndexName = process.env.NEXT_PUBLIC_PINECONE_HYBRID_INDEX?.trim();
const openaiKey = process.env.NEXT_PUBLIC_OPENAI_KEY?.trim();
const mongoUri = process.env.NEXT_PUBLIC_MONGO_URI;
const userId = process.env.BACKFILL_USER_ID;
const chatbotId = process.env.BACKFILL_CHATBOT_ID;
const sparseModel =
  process.env.PINECONE_SPARSE_MODEL?.trim() || "pinecone-sparse-english-v0";

const BATCH = 96;

if (!pineconeKey || !sourceIndexName || !hybridIndexName || !openaiKey || !mongoUri) {
  console.error("Missing required env vars — see script header.");
  process.exit(1);
}
if (!userId || !chatbotId) {
  console.error("Set BACKFILL_USER_ID and BACKFILL_CHATBOT_ID");
  process.exit(1);
}

const pc = new Pinecone({ apiKey: pineconeKey });
const openai = new OpenAI({ apiKey: openaiKey });
const sourceIndex = pc.index(sourceIndexName);
const hybridIndex = pc.index(hybridIndexName);

function collectVectorIds(docs) {
  const ids = [];
  for (const doc of docs) {
    if (Array.isArray(doc.content)) {
      for (const page of doc.content) {
        if (Array.isArray(page.dataID)) {
          ids.push(...page.dataID);
        }
      }
    } else if (Array.isArray(doc.dataID)) {
      ids.push(...doc.dataID);
    } else if (doc.dataID) {
      ids.push(doc.dataID);
    }
  }
  return [...new Set(ids.filter(Boolean))];
}

async function fetchLegacyRecords(ids) {
  const fetched = await sourceIndex.namespace(userId).fetch(ids);
  const records = [];
  for (const id of ids) {
    const record = fetched.records?.[id];
    if (!record?.metadata?.content) continue;
    records.push({
      id,
      metadata: record.metadata,
      values: record.values,
    });
  }
  return records;
}

async function embedDense(texts) {
  const response = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: texts,
  });
  return response.data.map((item) => item.embedding);
}

async function embedSparse(texts, inputType = "passage") {
  return embedSparseTexts({
    apiKey: pineconeKey,
    model: sparseModel,
    texts,
    inputType,
  });
}

async function upsertHybridBatch(records) {
  const texts = records.map((record) => String(record.metadata.content || ""));
  const [denseVectors, sparseVectors] = await Promise.all([
    embedDense(texts),
    embedSparse(texts, "passage"),
  ]);

  const vectors = records.map((record, index) => ({
    id: record.id,
    values: denseVectors[index],
    sparseValues: sparseVectors[index],
    metadata: record.metadata,
  }));

  await hybridIndex.namespace(userId).upsert(vectors);
  return vectors.length;
}

const mongo = new MongoClient(mongoUri);
await mongo.connect();
const db = mongo.db();
const docs = await db
  .collection("chatbots-data")
  .find({ chatbotId })
  .toArray();

const vectorIds = collectVectorIds(docs);
console.log(
  `Backfill ${chatbotId} namespace=${userId}: ${vectorIds.length} vector ids from Mongo`
);

let upserted = 0;
for (let i = 0; i < vectorIds.length; i += BATCH) {
  const idBatch = vectorIds.slice(i, i + BATCH);
  const legacyRecords = await fetchLegacyRecords(idBatch);
  if (!legacyRecords.length) {
    console.warn(`No legacy records for batch starting at ${i}`);
    continue;
  }
  const count = await upsertHybridBatch(legacyRecords);
  upserted += count;
  console.log(`Upserted ${upserted}/${vectorIds.length}`);
}

await mongo.close();
console.log(`Done. Upserted ${upserted} hybrid vectors to ${hybridIndexName}.`);
