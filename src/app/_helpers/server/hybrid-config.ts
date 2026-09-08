export function isHybridSearchEnabled(): boolean {
  const flag = process.env.HYBRID_SEARCH_ENABLED?.trim().toLowerCase();
  return flag === "1" || flag === "true" || flag === "yes";
}

export function isRerankEnabled(): boolean {
  const flag = process.env.RERANK_ENABLED?.trim().toLowerCase();
  // Default on when hybrid is on, unless explicitly disabled
  if (flag === "0" || flag === "false" || flag === "no") {
    return false;
  }
  if (flag === "1" || flag === "true" || flag === "yes") {
    return true;
  }
  return isHybridSearchEnabled();
}

export function getPineconeIndexName(): string {
  const hybridIndex = process.env.NEXT_PUBLIC_PINECONE_HYBRID_INDEX?.trim();
  if (isHybridSearchEnabled() && hybridIndex) {
    return hybridIndex;
  }
  const index = process.env.NEXT_PUBLIC_PINECONE_INDEX?.trim();
  if (!index) {
    throw new Error("NEXT_PUBLIC_PINECONE_INDEX is not configured");
  }
  return index;
}

export function getHybridAlpha(): number {
  const raw = process.env.PINECONE_HYBRID_ALPHA?.trim();
  const parsed = raw ? Number(raw) : 0.5;
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) {
    return 0.5;
  }
  return parsed;
}

export function getSparseModelName(): string {
  return (
    process.env.PINECONE_SPARSE_MODEL?.trim() || "pinecone-sparse-english-v0"
  );
}

export function getRerankModelName(): string {
  return process.env.PINECONE_RERANK_MODEL?.trim() || "bge-reranker-v2-m3";
}

export function getRerankTopN(): number {
  const parsed = Number(process.env.RERANK_TOP_N?.trim() || 5);
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 100) : 5;
}

export function getRerankCandidateLimit(): number {
  const parsed = Number(process.env.RERANK_CANDIDATES?.trim() || 50);
  // bge-reranker-v2-m3 hard max is 100 documents
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 100) : 50;
}

export function getPineconeApiKey(): string {
  const key = process.env.NEXT_PUBLIC_PINECONE_KEY?.trim();
  if (!key) {
    throw new Error("NEXT_PUBLIC_PINECONE_KEY is not configured");
  }
  return key;
}
