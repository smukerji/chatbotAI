import { v4 as uuidv4 } from "uuid";

/** Short factual lines worth indexing separately (years, counts). Contact
 *  phones/emails/WhatsApp/hours are handled by site-facts.ts from raw HTML. */
const STAT_LINE_PATTERNS = [
  /\b\d+\+?\s*years?\s+of\s+experience\b/i,
  /\b\d+[\d,]*\s*million\b[^.\n]{0,80}/i,
  /\b\d+[\d,]*\s*(medical\s+reviewers|customers|clients|users|readers|employees)\b[^.\n]{0,60}/i,
  /\bsince\s+\d{4}\b/i,
  /\bestablished\s+(?:in\s+)?\d{4}\b/i,
  /\bfounded\s+(?:in\s+)?\d{4}\b/i,
  /\bserving\s+.{0,40}\s+since\s+\d{4}\b/i,
];

const MAX_STAT_LINE_LEN = 220;
const MIN_STAT_LINE_LEN = 8;

export function extractStatLineChunks(
  pageText: string,
  pageLink?: string
): string[] {
  if (!pageText?.trim()) return [];

  const found = new Set<string>();
  const lines = pageText
    .split(/\n+/)
    .map((line) => line.replace(/^#+\s*/, "").trim())
    .filter((line) => line.length >= MIN_STAT_LINE_LEN);

  for (const line of lines) {
    if (line.length > MAX_STAT_LINE_LEN) continue;
    for (const pattern of STAT_LINE_PATTERNS) {
      if (pattern.test(line)) {
        found.add(line);
        break;
      }
    }
  }

  // Inline matches inside longer lines (e.g. markdown blobs)
  for (const pattern of STAT_LINE_PATTERNS) {
    const global = new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : pattern.flags + "g");
    for (const match of pageText.matchAll(global)) {
      const snippet = match[0].trim();
      if (
        snippet.length >= MIN_STAT_LINE_LEN &&
        snippet.length <= MAX_STAT_LINE_LEN
      ) {
        found.add(snippet);
      }
    }
  }

  const siteHint = pageLink ? ` (source: ${pageLink})` : "";
  return Array.from(found).map((line) =>
    line.endsWith(".") ? `${line}${siteHint}` : `${line}.${siteHint}`
  );
}

type CrawlChunkItem = {
  element: string;
  id: string;
  link?: string;
  pageText?: string;
  embedText?: string;
  isStatChunk?: boolean;
};

/**
 * Adds one small chunk per prominent factual / contact line on each crawled
 * page so hybrid sparse search can match years, phones, WhatsApp, hours, etc.
 */
export function appendPageStatChunks<T extends CrawlChunkItem>(items: T[]): T[] {
  const seen = new Set<string>();
  const extras: T[] = [];

  for (const item of items) {
    const pageText = item.pageText || item.element;
    const statLines = extractStatLineChunks(pageText, item.link);
    for (const line of statLines) {
      const key = `${item.link || ""}::${line}`;
      if (seen.has(key)) continue;
      seen.add(key);
      extras.push({
        ...item,
        element: line,
        embedText: line,
        id: uuidv4(),
        isStatChunk: true,
      });
    }
  }

  if (extras.length) {
    console.log(`[ingest] appended ${extras.length} page stat micro-chunks`);
  }

  return [...items, ...extras];
}
