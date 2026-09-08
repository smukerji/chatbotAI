import { OpenAI } from "openai";
import { isHybridSearchEnabled } from "./hybrid-config";
import { generateSparseEmbeddings } from "./sparse-embeddings";

function openaiClient(): OpenAI {
  return new OpenAI({ apiKey: process.env.NEXT_PUBLIC_OPENAI_KEY });
}

export type IngestVectorRecord = {
  id: string;
  values: number[];
  sparseValues?: { indices: number[]; values: number[] };
  metadata: Record<string, unknown>;
};

type BuildIngestVectorsInput = {
  denseTexts: string[];
  sparseTexts: string[];
  ids: string[];
  metadataList: Record<string, unknown>[];
};

export async function buildIngestVectors(
  input: BuildIngestVectorsInput
): Promise<IngestVectorRecord[]> {
  const { denseTexts, sparseTexts, ids, metadataList } = input;

  if (
    denseTexts.length !== sparseTexts.length ||
    denseTexts.length !== ids.length ||
    denseTexts.length !== metadataList.length
  ) {
    throw new Error("buildIngestVectors input arrays must have equal length");
  }

  if (!denseTexts.length) {
    return [];
  }

  const hybrid = isHybridSearchEnabled();

  const densePromise = openaiClient().embeddings.create({
    model: "text-embedding-ada-002",
    input: denseTexts,
  });

  const sparsePromise = hybrid
    ? generateSparseEmbeddings(sparseTexts, "passage")
    : Promise.resolve([]);

  const [denseResponse, sparseVectors] = await Promise.all([
    densePromise,
    sparsePromise,
  ]);

  return denseResponse.data.map((embeddingData, index) => {
    const record: IngestVectorRecord = {
      id: ids[index],
      values: embeddingData.embedding,
      metadata: metadataList[index],
    };

    if (hybrid && sparseVectors[index]) {
      record.sparseValues = {
        indices: sparseVectors[index].indices,
        values: sparseVectors[index].values,
      };
    }

    return record;
  });
}
