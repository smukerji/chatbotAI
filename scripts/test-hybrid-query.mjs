/**
 * Quick hybrid retrieval smoke test (no LLM filter).
 *
 * Usage:
 *   node scripts/test-hybrid-query.mjs
 */
import dotenv from "dotenv";
import OpenAI from "openai";
import { Pinecone } from "@pinecone-database/pinecone";
import { embedSparseTexts } from "./lib/pinecone-sparse.mjs";

dotenv.config({ path: ".env.local" });

const query =
  process.env.TEST_QUERY ||
  "How long has Healthline been providing health content?";
const userId = process.env.RAG_USER_ID || "6a854b34cc4c34df2fd63ddd";
const chatbotId =
  process.env.RAG_CHATBOT_ID || "665b9823-72c1-4bc6-a1f5-a491f288c7a9";
const alpha = Number(process.env.PINECONE_HYBRID_ALPHA || 0.65);

const pineconeKey = process.env.NEXT_PUBLIC_PINECONE_KEY?.trim();
const hybridIndex = process.env.NEXT_PUBLIC_PINECONE_HYBRID_INDEX?.trim();
const openaiKey = process.env.NEXT_PUBLIC_OPENAI_KEY?.trim();

const openai = new OpenAI({ apiKey: openaiKey });
const pc = new Pinecone({ apiKey: pineconeKey });
const index = pc.index(hybridIndex);

const dense = await openai.embeddings.create({
  model: "text-embedding-ada-002",
  input: query,
});
const denseVector = dense.data[0].embedding;
const [sparseVector] = await embedSparseTexts({
  apiKey: pineconeKey,
  model: "pinecone-sparse-english-v0",
  texts: [query],
  inputType: "query",
});

const scaledDense = denseVector.map((v) => v * alpha);
const scaledSparse = {
  indices: sparseVector.indices,
  values: sparseVector.values.map((v) => v * (1 - alpha)),
};

const response = await index.namespace(userId).query({
  topK: Number(process.env.TEST_TOP_K || 100),
  vector: scaledDense,
  sparseVector: scaledSparse,
  filter: { chatbotId: { $eq: chatbotId } },
  includeMetadata: true,
});

console.log(`Query: ${query}`);
console.log(`Alpha: ${alpha}`);
for (const [i, match] of (response.matches ?? []).slice(0, 10).entries()) {
  const content = String(match.metadata?.content || "").replace(/\s+/g, " ");
  console.log(
    `\n#${i + 1} score=${match.score?.toFixed(4)} id=${match.id}\n${content.slice(0, 220)}...`
  );
}

const hasYears = (response.matches ?? []).some((match) =>
  String(match.metadata?.content || "").includes("19 years")
);
const homeId =
  process.env.TEST_HOME_VECTOR_ID ||
  "70d1be28-7d93-4ac4-b161-aa96287c9300";
const homeRank = (response.matches ?? []).findIndex((m) => m.id === homeId);
console.log(`\nContains "19 years" in top ${response.matches?.length}: ${hasYears ? "YES" : "NO"}`);
console.log(`Homepage vector rank: ${homeRank >= 0 ? homeRank + 1 : "not in results"}`);
