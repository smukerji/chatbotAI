/**
 * Shared sparse embedding via Pinecone Inference REST API.
 */
function parseSparseRecord(item) {
  const indices =
    item.sparseIndices ?? item.sparse_indices ?? item.indices;
  const values =
    item.sparseValues ?? item.sparse_values ?? item.values;
  if (!indices?.length || !values?.length) {
    throw new Error("Sparse embedding missing from Pinecone Inference");
  }
  return { indices, values };
}

export async function embedSparseTexts({
  apiKey,
  model,
  texts,
  inputType = "passage",
}) {
  const response = await fetch("https://api.pinecone.io/embed", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Api-Key": apiKey,
      "X-Pinecone-API-Version": "2025-01",
    },
    body: JSON.stringify({
      model,
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

  const payload = await response.json();
  return (payload.data ?? []).map((item) => parseSparseRecord(item));
}
