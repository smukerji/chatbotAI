import { Index, RecordMetadata } from "@pinecone-database/pinecone";
import { getHybridAlpha } from "./hybrid-config";
import type { SparseVector } from "./sparse-embeddings";

export type HybridQueryOptions = {
  denseVector: number[];
  sparseVector: SparseVector;
  topK: number;
  filter?: Record<string, unknown>;
  alpha?: number;
};

export function scaleHybridVectors(
  denseVector: number[],
  sparseVector: SparseVector,
  alpha: number
): { vector: number[]; sparseVector: SparseVector } {
  const boundedAlpha = Math.max(0, Math.min(1, alpha));
  return {
    vector: denseVector.map((value) => value * boundedAlpha),
    sparseVector: {
      indices: sparseVector.indices,
      values: sparseVector.values.map((value) => value * (1 - boundedAlpha)),
    },
  };
}

export async function hybridQuery(
  index: Index<RecordMetadata>,
  namespace: string,
  options: HybridQueryOptions
) {
  const alpha = options.alpha ?? getHybridAlpha();
  const scaled = scaleHybridVectors(
    options.denseVector,
    options.sparseVector,
    alpha
  );

  return index.namespace(namespace).query({
    topK: options.topK,
    vector: scaled.vector,
    sparseVector: scaled.sparseVector,
    filter: options.filter,
    includeMetadata: true,
  });
}
