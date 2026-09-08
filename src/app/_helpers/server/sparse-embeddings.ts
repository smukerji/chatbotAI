import {
  getPineconeApiKey,
  getSparseModelName,
} from "./hybrid-config";

export type SparseVector = {
  indices: number[];
  values: number[];
};

const SPARSE_BATCH_SIZE = 96;
const PINECONE_INFERENCE_URL = "https://api.pinecone.io/embed";
const PINECONE_API_VERSION = "2025-01";

function parseSparseEmbedding(record: unknown): SparseVector | null {
  const embedding = record as {
    sparseValues?: number[];
    sparseIndices?: number[];
    sparse_values?: number[];
    sparse_indices?: number[];
    values?: number[];
    indices?: number[];
  };

  const indices =
    embedding.sparseIndices ??
    embedding.sparse_indices ??
    embedding.indices;
  const values =
    embedding.sparseValues ??
    embedding.sparse_values ??
    embedding.values;

  if (!indices?.length || !values?.length) {
    return null;
  }

  return { indices, values };
}

async function embedSparseViaRest(
  texts: string[],
  inputType: "passage" | "query"
): Promise<SparseVector[]> {
  const response = await fetch(PINECONE_INFERENCE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Api-Key": getPineconeApiKey(),
      "X-Pinecone-API-Version": PINECONE_API_VERSION,
    },
    body: JSON.stringify({
      model: getSparseModelName(),
      inputs: texts.map((text) => ({ text })),
      parameters: {
        input_type: inputType,
        truncate: "END",
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Pinecone sparse embed failed (${response.status}): ${body.slice(0, 300)}`
    );
  }

  const payload = (await response.json()) as { data?: unknown[] };
  const results: SparseVector[] = [];

  for (const record of payload.data ?? []) {
    const parsed = parseSparseEmbedding(record);
    if (!parsed) {
      throw new Error("Sparse embedding not returned from Pinecone Inference");
    }
    results.push(parsed);
  }

  return results;
}

async function embedSparseViaSdk(
  texts: string[],
  inputType: "passage" | "query"
): Promise<SparseVector[]> {
  const { Pinecone } = await import("@pinecone-database/pinecone");
  const pc = new Pinecone({ apiKey: getPineconeApiKey() });

  if (!pc.inference?.embed) {
    return embedSparseViaRest(texts, inputType);
  }

  const response = await pc.inference.embed({
    model: getSparseModelName(),
    inputs: texts.map((text) => ({ text })),
    parameters: {
      inputType,
      truncate: "END",
    },
  });

  const results: SparseVector[] = [];
  for (const record of response.data ?? []) {
    const parsed = parseSparseEmbedding(record);
    if (!parsed) {
      throw new Error("Sparse embedding not returned from Pinecone Inference");
    }
    results.push(parsed);
  }

  return results;
}

export async function generateSparseEmbeddings(
  texts: string[],
  inputType: "passage" | "query" = "passage"
): Promise<SparseVector[]> {
  if (!texts.length) {
    return [];
  }

  const results: SparseVector[] = [];

  for (let i = 0; i < texts.length; i += SPARSE_BATCH_SIZE) {
    const batch = texts.slice(i, i + SPARSE_BATCH_SIZE);
    const batchResults = await embedSparseViaSdk(batch, inputType);
    results.push(...batchResults);
  }

  return results;
}

export async function generateSparseEmbedding(
  text: string,
  inputType: "passage" | "query" = "passage"
): Promise<SparseVector> {
  const [embedding] = await generateSparseEmbeddings([text], inputType);
  if (!embedding) {
    throw new Error("Sparse embedding not returned from Pinecone Inference");
  }
  return embedding;
}

export async function generateSparseQueryEmbedding(
  query: string
): Promise<SparseVector> {
  return generateSparseEmbedding(query, "query");
}
