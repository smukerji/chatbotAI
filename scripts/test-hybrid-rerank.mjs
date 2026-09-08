/**
 * Smoke-test hybrid retrieve + site_fact merge + Pinecone Inference rerank.
 * Mirrors production candidate assembly in pinecone.js.
 *
 * Usage:
 *   node scripts/test-hybrid-rerank.mjs
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import OpenAI from "openai";
import { Pinecone } from "@pinecone-database/pinecone";
import { embedSparseTexts } from "./lib/pinecone-sparse.mjs";

const userId = process.env.RAG_USER_ID?.trim();
const chatbotId = process.env.RAG_CHATBOT_ID?.trim();
const query =
  process.env.TEST_QUERY ||
  "What is the WhatsApp number for Float Co Hong Kong?";
const alpha = Number(process.env.PINECONE_HYBRID_ALPHA || 0.5);
const hybridIndex =
  process.env.NEXT_PUBLIC_PINECONE_HYBRID_INDEX || "luciferai-hybrid";
const pineconeKey = process.env.NEXT_PUBLIC_PINECONE_KEY?.trim();
const openaiKey = process.env.NEXT_PUBLIC_OPENAI_KEY?.trim();
const model = process.env.PINECONE_RERANK_MODEL || "bge-reranker-v2-m3";

if (!userId || !chatbotId || !pineconeKey || !openaiKey) {
  console.error(
    "Set RAG_USER_ID, RAG_CHATBOT_ID, NEXT_PUBLIC_PINECONE_KEY, NEXT_PUBLIC_OPENAI_KEY"
  );
  process.exit(1);
}

const openai = new OpenAI({ apiKey: openaiKey });
const pc = new Pinecone({ apiKey: pineconeKey });
const index = pc.index(hybridIndex);

const dense = (
  await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: query,
  })
).data[0].embedding;

const [sparse] = await embedSparseTexts({
  apiKey: pineconeKey,
  model: "pinecone-sparse-english-v0",
  texts: [query],
  inputType: "query",
});

const scaled = {
  vector: dense.map((v) => v * alpha),
  sparseVector: {
    indices: sparse.indices,
    values: sparse.values.map((v) => v * (1 - alpha)),
  },
};

const [hybrid, siteFacts] = await Promise.all([
  index.namespace(userId).query({
    topK: 50,
    ...scaled,
    filter: { chatbotId: { $eq: chatbotId } },
    includeMetadata: true,
  }),
  index.namespace(userId).query({
    topK: 15,
    ...scaled,
    filter: {
      chatbotId: { $eq: chatbotId },
      chunk_type: { $eq: "site_fact" },
    },
    includeMetadata: true,
  }),
]);

const pages = (hybrid.matches || [])
  .filter((m) => m.metadata?.chunk_type !== "site_fact")
  .slice(0, 35)
  .map((m) => ({
    id: m.id,
    hybridScore: m.score,
    content: String(m.metadata?.content || ""),
    link: m.metadata?.link || m.metadata?.source_url || "",
    chunkType: m.metadata?.chunk_type || "page",
  }));

const facts = (siteFacts.matches || []).map((m) => ({
  id: m.id,
  hybridScore: m.score,
  content: String(m.metadata?.content || ""),
  link: m.metadata?.link || m.metadata?.source_url || "",
  chunkType: "site_fact",
}));

const seen = new Set();
const candidates = [];
for (const c of [...pages, ...facts]) {
  const key = c.content;
  if (seen.has(key)) continue;
  seen.add(key);
  candidates.push(c);
}

console.log(`Query: ${query}`);
console.log(
  `Candidates: ${candidates.length} (pages=${pages.length}, site_facts=${facts.length})`
);
console.log("\n--- Hybrid page top 5 ---");
pages.slice(0, 5).forEach((c, i) => {
  console.log(
    `#${i + 1} ${c.hybridScore?.toFixed(3)} ${c.content.replace(/\s+/g, " ").slice(0, 100)}`
  );
});
console.log("\n--- Site facts merged ---");
facts.slice(0, 8).forEach((c, i) => {
  console.log(
    `#${i + 1} ${c.hybridScore?.toFixed(3)} ${c.content.replace(/\s+/g, " ").slice(0, 100)}`
  );
});

const docs = candidates.map((c, i) => ({
  id: String(i),
  text: c.content.slice(0, 1500),
}));

const rerankRes = await fetch("https://api.pinecone.io/rerank", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Api-Key": pineconeKey,
    "X-Pinecone-API-Version": "2025-01",
  },
  body: JSON.stringify({
    model,
    query,
    top_n: 5,
    return_documents: false,
    rank_fields: ["text"],
    documents: docs,
    parameters: { truncate: "END" },
  }),
});

if (!rerankRes.ok) {
  console.error("Rerank failed:", rerankRes.status, await rerankRes.text());
  process.exit(1);
}

const ranked = await rerankRes.json();
console.log("\n--- Rerank top 5 ---");
for (const [i, item] of (ranked.data || []).entries()) {
  const c = candidates[item.index];
  console.log(
    `#${i + 1} rerank=${item.score?.toFixed(4)} type=${c.chunkType} ${c.content
      .replace(/\s+/g, " ")
      .slice(0, 120)}`
  );
}

const joined = (ranked.data || [])
  .map((item) => candidates[item.index]?.content || "")
  .join("\n");
console.log(
  `\nContains phone 2548 in rerank top 5: ${/2548/.test(joined) ? "YES" : "NO"}`
);
console.log(
  `Contains WhatsApp/5570 in rerank top 5: ${/5570|WhatsApp/i.test(joined) ? "YES" : "NO"}`
);
