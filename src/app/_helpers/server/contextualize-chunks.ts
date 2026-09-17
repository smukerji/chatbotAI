import { OpenAI } from "openai";

function client() {
  return new OpenAI({ apiKey: process.env.NEXT_PUBLIC_OPENAI_KEY });
}

/// Anthropic Contextual Retrieval: a short situating blurb prepended to each
/// chunk before it is embedded. One LLM call per chunk, at ingest only.
/// Prompt caching on the document prefix makes later chunks from the same page
/// cheap; failures fall back to the original chunk so indexing never blocks.
const CONTEXT_MODEL = "gpt-4o-mini";
export const DOC_CHAR_LIMIT = 24000;
/// Keep low: Vercel store-v2 is capped at 5m; OpenAI 429 storms burn the budget.
const CONCURRENCY = Math.max(
  1,
  Math.min(8, Number(process.env.CONTEXTUALIZE_CONCURRENCY || 3) || 3)
);
const PAGE_GROUP_CONCURRENCY = Math.max(
  1,
  Math.min(4, Number(process.env.CONTEXTUALIZE_PAGE_CONCURRENCY || 2) || 2)
);
const MAX_RETRIES = 3;
const RATE_LIMIT_ABORT_AFTER = 8;

function isRateLimitError(error: any): boolean {
  const status = error?.status || error?.response?.status || error?.code;
  const msg = String(error?.message || "").toLowerCase();
  return (
    status === 429 ||
    msg.includes("429") ||
    msg.includes("rate limit") ||
    msg.includes("too many requests")
  );
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function shouldContextualizeAtIngest(chunkCount: number): boolean {
  if (process.env.DISABLE_CONTEXTUAL_INGEST === "1") return false;
  const max = Number(process.env.CONTEXTUALIZE_MAX_CHUNKS || 800);
  if (!Number.isFinite(max) || max <= 0) return true;
  return chunkCount <= max;
}

export type ContextualizedChunk = {
  raw: string;
  embed: string;
};

export function buildDoclingDocumentAnchor(
  chunks: string[],
  limit = DOC_CHAR_LIMIT
): string {
  if (!chunks.length) return "";

  const structural = chunks
    .slice(0, 40)
    .flatMap((chunk) => chunk.split("\n"))
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter(
      (line) =>
        line.startsWith("#") ||
        /^(\d+\.)+\s/.test(line) ||
        (line.length < 100 && /^[A-Z]/.test(line))
    )
    .slice(0, 60);

  const earlyBody = chunks.slice(0, 12).join("\n\n");
  const anchor = Array.from(new Set([...structural, earlyBody]))
    .join("\n\n")
    .trim();
  return anchor.slice(0, limit);
}

export async function contextualizeChunks(
  documentText: string,
  chunks: string[]
): Promise<ContextualizedChunk[]> {
  if (!chunks.length) return chunks.map((raw) => ({ raw, embed: raw }));
  if (!shouldContextualizeAtIngest(chunks.length)) {
    console.log(
      `[contextualize] skipping LLM situate for ${chunks.length} chunks (over CONTEXTUALIZE_MAX_CHUNKS or DISABLE_CONTEXTUAL_INGEST)`
    );
    return chunks.map((raw) => ({ raw, embed: raw }));
  }
  const document = (documentText || "").trim().slice(0, DOC_CHAR_LIMIT);
  if (!document) return chunks.map((raw) => ({ raw, embed: raw }));

  const results: ContextualizedChunk[] = chunks.map((raw) => ({
    raw,
    embed: raw,
  }));
  let next = 0;
  let consecutiveRateLimits = 0;
  let abortedForRateLimit = false;

  console.log(
    `[contextualize] situating ${chunks.length} chunks concurrency=${CONCURRENCY}`
  );

  const worker = async () => {
    while (next < chunks.length) {
      if (abortedForRateLimit) return;
      const i = next++;
      const chunk = chunks[i];
      if (!chunk?.trim()) continue;
      try {
        const context = await situateChunk(document, chunk);
        consecutiveRateLimits = 0;
        if (context) results[i] = { raw: chunk, embed: `${context}\n\n${chunk}` };
      } catch (error: any) {
        if (isRateLimitError(error)) {
          consecutiveRateLimits += 1;
          if (consecutiveRateLimits >= RATE_LIMIT_ABORT_AFTER) {
            abortedForRateLimit = true;
            console.warn(
              `[contextualize] aborting remaining situate after ${RATE_LIMIT_ABORT_AFTER} rate limits; indexing raw chunks`
            );
            return;
          }
        }
        console.warn(
          "[contextualize] chunk failed, indexing original text:",
          error?.message || error
        );
      }
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, chunks.length) }, () => worker())
  );
  if (abortedForRateLimit) {
    console.warn(
      `[contextualize] completed with rate-limit abort; remaining chunks kept raw`
    );
  }
  return results;
}

/// Crawl chunks arrive flattened; regroup by page so the situating prompt sees
/// the whole page, not an isolated 3000-character window.
export async function prependContextToCrawlChunks<
  T extends { element: string; link?: string; pageText?: string; embedText?: string }
>(items: T[]): Promise<T[]> {
  if (!items?.length) return items;

  if (!shouldContextualizeAtIngest(items.length)) {
    console.log(
      `[contextualize] skipping LLM situate for ${items.length} chunks (over CONTEXTUALIZE_MAX_CHUNKS or DISABLE_CONTEXTUAL_INGEST)`
    );
    return items.map((item) => ({ ...item, embedText: item.element }));
  }

  const groups = new Map<string, { index: number; item: T }[]>();
  items.forEach((item, index) => {
    const key = item.link || item.pageText || `__chunk_${index}`;
    const group = groups.get(key) ?? [];
    group.push({ index, item });
    groups.set(key, group);
  });

  const out = [...items];
  const groupList = Array.from(groups.values());
  console.log(
    `[contextualize] situating ${items.length} chunks across ${groupList.length} pages`
  );

  for (let i = 0; i < groupList.length; i += PAGE_GROUP_CONCURRENCY) {
    const batch = groupList.slice(i, i + PAGE_GROUP_CONCURRENCY);
    await Promise.all(
      batch.map(async (group) => {
        const document =
          group[0].item.pageText ||
          group.map(({ item }) => item.element).join("\n\n");
        const chunks = group.map(({ item }) => item.element);
        const contextualized = await contextualizeChunks(document, chunks);
        group.forEach(({ index }, j) => {
          out[index] = {
            ...out[index],
            element: contextualized[j].raw,
            embedText: contextualized[j].embed,
          };
        });
      })
    );
    console.log(
      `[contextualize] pages ${Math.min(i + PAGE_GROUP_CONCURRENCY, groupList.length)}/${groupList.length}`
    );
  }
  return out;
}

async function situateChunk(
  document: string,
  chunk: string
): Promise<string> {
  let lastError: any;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await client().chat.completions.create({
        model: CONTEXT_MODEL,
        temperature: 0,
        max_tokens: 120,
        messages: [
          {
            role: "user",
            content: `<document>
${document}
</document>
Here is the chunk we want to situate within the whole document
<chunk>
${chunk}
</chunk>
Please give a short succinct context to situate this chunk within the overall document for the purposes of improving search retrieval of the chunk. Answer only with the succinct context and nothing else.`,
          },
        ],
      });

      const text = response.choices?.[0]?.message?.content?.trim() || "";
      if (!text || text.length > 600) return "";
      return text.replace(/^["']|["']$/g, "");
    } catch (error: any) {
      lastError = error;
      if (!isRateLimitError(error) || attempt === MAX_RETRIES) break;
      const backoffMs = Math.min(8000, 500 * 2 ** attempt);
      await sleep(backoffMs);
    }
  }
  throw lastError;
}
