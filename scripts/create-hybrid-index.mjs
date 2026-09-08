/**
 * Create a Pinecone hybrid index (dotproduct + 1536 dims for ada-002).
 *
 * Usage:
 *   node scripts/create-hybrid-index.mjs
 *
 * Env (from .env.local):
 *   NEXT_PUBLIC_PINECONE_KEY
 *   NEXT_PUBLIC_PINECONE_INDEX          — source index (copies region/cloud)
 *   NEXT_PUBLIC_PINECONE_HYBRID_INDEX   — new index name (default: luciferai-hybrid)
 */
import dotenv from "dotenv";
import { Pinecone } from "@pinecone-database/pinecone";

dotenv.config({ path: ".env.local" });

const apiKey = process.env.NEXT_PUBLIC_PINECONE_KEY?.trim();
const sourceIndexName = process.env.NEXT_PUBLIC_PINECONE_INDEX?.trim();
const hybridIndexName =
  process.env.NEXT_PUBLIC_PINECONE_HYBRID_INDEX?.trim() || "luciferai-hybrid";
const dimension = Number(process.env.PINECONE_HYBRID_DIMENSION || 1536);

if (!apiKey || !sourceIndexName) {
  console.error("Set NEXT_PUBLIC_PINECONE_KEY and NEXT_PUBLIC_PINECONE_INDEX");
  process.exit(1);
}

const pc = new Pinecone({ apiKey });

const existing = await pc.listIndexes();
const names = existing.indexes?.map((item) => item.name) ?? [];

if (names.includes(hybridIndexName)) {
  console.log(`Index "${hybridIndexName}" already exists — skipping create.`);
  process.exit(0);
}

const source = await pc.describeIndex(sourceIndexName);
const cloud = source.spec?.serverless?.cloud || "aws";
const region = source.spec?.serverless?.region || "us-east-1";

console.log(
  `Creating hybrid index "${hybridIndexName}" (${dimension}d, dotproduct) in ${cloud}/${region}`
);

await pc.createIndex({
  name: hybridIndexName,
  dimension,
  metric: "dotproduct",
  spec: {
    serverless: {
      cloud,
      region,
    },
  },
  waitUntilReady: true,
});

console.log(`Index "${hybridIndexName}" is ready.`);
console.log("Add to .env.local:");
console.log(`  NEXT_PUBLIC_PINECONE_HYBRID_INDEX=${hybridIndexName}`);
console.log("  HYBRID_SEARCH_ENABLED=1");
console.log("  PINECONE_HYBRID_ALPHA=0.65");
