import {
  getPineconeApiKey,
  getRerankModelName,
  getRerankTopN,
} from "./hybrid-config";

const PINECONE_RERANK_URL = "https://api.pinecone.io/rerank";
const PINECONE_API_VERSION = "2025-01";
const DEFAULT_TRUNCATE_CHARS = 1500;
const DEFAULT_TIMEOUT_MS = 8000;

export type RerankableDoc = {
  content: string;
  score?: number;
  [key: string]: unknown;
};

export type RerankOptions = {
  query: string;
  documents: RerankableDoc[];
  topN?: number;
  model?: string;
  truncateChars?: number;
  timeoutMs?: number;
};

function truncateText(text: string, maxChars: number): string {
  if (!text) return "";
  return text.length <= maxChars ? text : text.slice(0, maxChars);
}

/**
 * Rerank hybrid candidates with Pinecone Inference (cross-encoder).
 * Uses REST so it works even when the installed Pinecone SDK lacks inference.
 * On failure, callers should fall back to the original hybrid ranking.
 */
export async function rerankDocuments(
  options: RerankOptions
): Promise<RerankableDoc[]> {
  const {
    query,
    documents,
    topN = getRerankTopN(),
    model = getRerankModelName(),
    truncateChars = DEFAULT_TRUNCATE_CHARS,
    timeoutMs = DEFAULT_TIMEOUT_MS,
  } = options;

  if (!documents.length) {
    return [];
  }
  if (!query?.trim()) {
    return documents.slice(0, topN);
  }

  const payloadDocs = documents.map((doc, index) => ({
    id: String(index),
    text: truncateText(String(doc.content || ""), truncateChars),
  }));

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(PINECONE_RERANK_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "Api-Key": getPineconeApiKey(),
        "X-Pinecone-API-Version": PINECONE_API_VERSION,
      },
      body: JSON.stringify({
        model,
        query,
        top_n: Math.min(topN, documents.length),
        return_documents: false,
        rank_fields: ["text"],
        documents: payloadDocs,
        parameters: {
          truncate: "END",
        },
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `Pinecone rerank failed (${response.status}): ${body.slice(0, 300)}`
      );
    }

    const payload = (await response.json()) as {
      data?: Array<{ index?: number; score?: number }>;
    };

    const ranked: RerankableDoc[] = [];
    for (const item of payload.data ?? []) {
      const idx = Number(item.index);
      if (!Number.isInteger(idx) || idx < 0 || idx >= documents.length) {
        continue;
      }
      ranked.push({
        ...documents[idx],
        score: typeof item.score === "number" ? item.score : documents[idx].score,
        rerankScore: item.score,
      });
    }

    if (!ranked.length) {
      throw new Error("Pinecone rerank returned no ranked documents");
    }

    return ranked.slice(0, topN);
  } finally {
    clearTimeout(timer);
  }
}
