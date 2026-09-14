import { createHash } from "crypto";
import { Pinecone } from "@pinecone-database/pinecone";
import { OpenAI } from "openai";
import dotenv from "dotenv";
import { getPineconeApiKey, getPineconeIndexName } from "./hybrid-config";

dotenv.config();

let pineconeClient: Pinecone | null = null;

export function getPineconeClient(): Pinecone {
  if (!pineconeClient) {
    pineconeClient = new Pinecone({ apiKey: getPineconeApiKey() });
  }
  return pineconeClient;
}

export function getActivePineconeIndex() {
  return getPineconeClient().index(getPineconeIndexName());
}

export const upsert = async (vectors: any, userId: string) => {
  try {
    const index = getActivePineconeIndex();
    const upsertReq = await index.namespace(userId).upsert(vectors);
    return upsertReq;
  } catch (error) {
    console.error("Error during upsert:", error);
    return error;
  }
};

export const deletevectors = async (vectorIDs: [], namespace: string) => {
  try {
    const index = getActivePineconeIndex();
    const np = index.namespace(namespace);
    await np.deleteMany(vectorIDs);
  } catch (error) {
    console.error("Error initializing Pinecone client:", error);
    throw new Error("Failed to initialize Pinecone client while deleting");
  }
};

export const deleteFileVectorsById = async (userid: any, vectorIDs: any) => {
  try {
    const index = getActivePineconeIndex();
    const np = index.namespace(userid);

    const deleteVec = await np.deleteMany(vectorIDs);
    console.log("delete file vectors", vectorIDs);
    return deleteVec;
  } catch (error) {
    console.error("Error initializing Pinecone client:", error);
    throw new Error(
      "Failed to initialize Pinecone client while deleting vectors by id"
    );
  }
};

function staleDocFactId(
  chatbotId: string,
  filename: string,
  type: string,
  value: string
): string {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
  const digest = createHash("sha256")
    .update(`${chatbotId}|${filename}|${type}|${normalized}`)
    .digest("hex")
    .slice(0, 32);
  return `docfact-${digest}`;
}

async function probeDenseEmbedding(text: string): Promise<number[]> {
  const openai = new OpenAI({ apiKey: process.env.NEXT_PUBLIC_OPENAI_KEY });
  const res = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: text,
  });
  return res.data[0].embedding;
}

/**
 * Remove prior doc_fact vectors for a filename so bad/stale facts cannot linger.
 * Hybrid indexes may reject metadata filters on delete — fall back to id delete.
 */
export async function deleteDocFactsForFile(
  userId: string,
  filename: string,
  chatbotId: string = ""
): Promise<void> {
  if (!userId || !filename) return;
  const index = getActivePineconeIndex();
  const np = index.namespace(userId);

  try {
    await np.deleteMany({
      filter: {
        chunk_type: { $eq: "doc_fact" },
        filename: { $eq: filename },
      },
    });
    console.log(`[ingest] deleted prior doc_fact vectors for file=${filename}`);
    return;
  } catch (error) {
    console.warn(
      "[ingest] deleteDocFactsForFile filter unsupported, falling back to id delete:",
      (error as Error)?.message || error
    );
  }

  try {
    const idSet = new Set<string>();

    if (chatbotId) {
      for (const value of [
        "Volume ?, Issue ?, 2020",
        "Volume ?, Issue ?, 2020.",
      ]) {
        idSet.add(staleDocFactId(chatbotId, filename, "publication", value));
      }
    }

    const probeQueries = [
      `Publication: Volume Issue Document: ${filename}`,
      `Paper ID Authors Title Journal ISSN Document: ${filename}`,
      `Publication Document: ${filename}`,
    ];
    for (const q of probeQueries) {
      const values = await probeDenseEmbedding(q);
      const res = await np.query({
        vector: values,
        topK: 50,
        includeMetadata: true,
      });
      for (const m of res.matches || []) {
        const meta = (m.metadata || {}) as Record<string, unknown>;
        if (
          meta.chunk_type === "doc_fact" &&
          String(meta.filename || "") === filename &&
          m.id
        ) {
          idSet.add(m.id);
        }
      }
    }

    const ids = Array.from(idSet);
    if (!ids.length) {
      console.log(
        `[ingest] no prior doc_fact vectors found via query for file=${filename}`
      );
      return;
    }
    await np.deleteMany(ids);
    console.log(
      `[ingest] deleted ${ids.length} prior doc_fact vectors by id for file=${filename}`
    );
  } catch (error) {
    console.warn(
      "[ingest] deleteDocFactsForFile fallback failed:",
      (error as Error)?.message || error
    );
  }
}

export const updateVectorsById = async (vectors: any, userId: any) => {
  try {
    const index = getActivePineconeIndex();
    console.log("Update data ", vectors);

    const upsertReq = await index.namespace(userId).upsert(vectors);
    console.log("Upsert request when updating", upsertReq);

    return upsertReq;
  } catch (error) {
    console.error("Error during update upsert:", error);
    return error;
  }
};
