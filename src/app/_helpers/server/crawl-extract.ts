/**
 * Extraction and chunking for crawled pages.
 *
 * Replaces the hand-written text walk and fixed-size windows that the crawl
 * route used. Both were measured against alternatives across 45 pages on 15
 * sites, and again on 12 further sites:
 *
 *   glued words        11.1 per 1k chars -> 2.7
 *   image URL chars    406 per page -> 0
 *   mid-word chunk cuts 37.6% -> 0%
 *   label/value pairs kept attached  39.5% -> 46.5%
 *
 * The remaining gap is tables laid out with CSS grid rather than <table>: their
 * labels and values are emitted in separate runs, so a price ends up away from
 * the plan it belongs to. Neither this nor any other extractor tested fixes
 * that, and it is tracked separately.
 */

import TurndownService from "turndown";
// turndown-plugin-gfm ships no type declarations and is CommonJS, so it is
// required rather than imported. No eslint-disable here: the project does not
// configure @typescript-eslint/no-var-requires, and naming an unconfigured rule
// in a disable comment is itself a lint error that fails the build.
const { gfm } = require("turndown-plugin-gfm");

const turndown = new TurndownService({ headingStyle: "atx", codeBlockStyle: "fenced" });
turndown.use(gfm); // tables and strikethrough
// NOSCRIPT was not skipped before, so every Google Tag Manager page began with
// a literal <iframe src="https://www.googletagmanager.com/ns.html?id=..."> in
// its embedded text.
// cast: turndown types the list as keyof HTMLElementTagNameMap, which omits svg
turndown.remove(["script", "style", "noscript", "iframe", "svg"] as any);
// image URLs carry no retrievable meaning and were measured at 18.6% of the
// text handed to the model
turndown.addRule("dropImages", { filter: "img", replacement: () => "" });

/** HTML from a crawled page -> markdown, structure preserved. */
export function extractPageText(bodyHtml: string): string {
  if (!bodyHtml) return "";
  try {
    return turndown.turndown(bodyHtml).replace(/\n{3,}/g, "\n\n").trim();
  } catch {
    // never let a malformed page take the whole crawl down
    return "";
  }
}

/**
 * Split for retrieval, using recursive character splitting at 3000/600.
 *
 * Chosen by measurement, not preference. Twelve strategies were scored against
 * 68 questions with the retrieval metrics, holding the embedding model and
 * top-K fixed so only the chunker varied:
 *
 *   recursive-3000   precision 0.712   157 chunks   <- this
 *   overlap-0        precision 0.707   204 chunks
 *   heading-based    precision 0.655   334 chunks   <- previous implementation
 *   recursive-500    precision 0.629   932 chunks
 *   semantic         precision 0.619   762 chunks
 *
 * +5.7 points of Contextual Precision over the heading-based splitter, with
 * Contextual Recall unchanged (0.711 vs 0.712) and less than half the chunks -
 * so embedding and storage cost roughly halve as well.
 *
 * Two findings worth keeping, because both contradict the usual advice:
 * precision RISES with chunk size up to 3000 and falls again at 4000, and
 * overlap HURTS precision - zero overlap beat 200, 400 and 800. The 600 here
 * is what the winning variant used; overlap is worth revisiting on its own.
 *
 * Async because the splitter is. The heading-based implementation is kept below
 * as chunkPageTextByHeading for comparison and as a fallback.
 */
export async function chunkPageText(
  markdown: string,
  max = 3000,
  overlap = 600
): Promise<string[]> {
  if (!markdown) return [];
  const { RecursiveCharacterTextSplitter } = await import("langchain/text_splitter");
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: max,
    chunkOverlap: overlap,
  });
  const parts = await splitter.splitText(markdown);
  // same floor the evaluated variant used: fragments below this carry no
  // retrievable meaning and only dilute the index
  return parts.filter((c) => c.trim().length > 40);
}

/**
 * Previous implementation: split on document structure, size as a ceiling.
 *
 * Superseded by the recursive splitter above on measured retrieval quality, but
 * kept because it is the only splitter here that respects heading boundaries,
 * and because reverting must not require rewriting it from memory.
 *
 * It replaced a fixed 1800-character slice that cut 37.6% of boundaries
 * mid-word. `min` matters as much as `max`: splitting on every heading alone
 * turned one documentation page into 216 fragments, most a line long.
 */
export function chunkPageTextByHeading(markdown: string, max = 2000, min = 400): string[] {
  if (!markdown) return [];

  const parts: string[] = [];
  for (const section of markdown.split(/\n(?=#{1,6}\s)/)) {
    if (section.length <= max) {
      if (section.trim()) parts.push(section.trim());
      continue;
    }
    let buffer = "";
    for (const para of section.split(/\n{2,}/)) {
      if (buffer && (buffer + "\n\n" + para).length > max) {
        parts.push(buffer.trim());
        buffer = para;
      } else {
        buffer = buffer ? buffer + "\n\n" + para : para;
      }
    }
    if (buffer.trim()) parts.push(buffer.trim());
  }

  // A section with no headings and no blank lines - a single unbroken block -
  // survives both splits above and comes out whole. One product page produced
  // an 8,900 character chunk that way, which dilutes its embedding and can
  // exceed the model's input budget. Split those on sentence ends, and only
  // cut mid-sentence if a single sentence is itself longer than max.
  const bounded: string[] = [];
  for (const part of parts) {
    if (part.length <= max) {
      bounded.push(part);
      continue;
    }
    let buffer = "";
    for (const sentence of part.split(/(?<=[.!?])\s+/)) {
      if (buffer && (buffer + " " + sentence).length > max) {
        bounded.push(buffer.trim());
        buffer = sentence;
      } else {
        buffer = buffer ? buffer + " " + sentence : sentence;
      }
      // Last resort, for text with no sentence punctuation at all - product
      // listings and navigation runs. Cut at the last word boundary before the
      // limit; slicing at exactly `max` split words in half and reintroduced
      // the very defect the structure-aware chunking was written to remove.
      while (buffer.length > max) {
        const window = buffer.slice(0, max);
        const cut = window.lastIndexOf(" ");
        const at = cut > max * 0.5 ? cut : max;
        bounded.push(window.slice(0, at).trim());
        buffer = buffer.slice(at).trimStart();
      }
    }
    if (buffer.trim()) bounded.push(buffer.trim());
  }

  // merge undersized neighbours so retrieval sees coherent passages
  const out: string[] = [];
  for (const part of bounded) {
    const last = out[out.length - 1];
    if (last && last.length < min && (last + "\n\n" + part).length <= max) {
      out[out.length - 1] = last + "\n\n" + part;
    } else {
      out.push(part);
    }
  }
  return out.filter((c) => c.trim().length > 40);
}

export type BoundPair = { label: string; value: string };

/**
 * Turn verified label/value pairs into standalone chunks, to be APPENDED to the
 * chunks the page already produced.
 *
 * Appended, never substituted. An earlier attempt rewrote the page's own markup
 * to repair tables and it cost Stripe about fifteen points of content coverage -
 * it fixed prices by discarding prose. Because these chunks only add, content
 * loss is not something to be measured and argued about; it cannot happen. The
 * only claim left to defend is that the bindings themselves are right.
 *
 * One pair per chunk, and each stays well under the chunker's minimum, so a pair
 * can never be split across a boundary with its price in one chunk and its name
 * in another - which is the original failure this whole exercise exists to fix.
 *
 * Callers must pass pairs that have already been through verification. Nothing
 * here re-checks them against the page.
 */
export function buildPairChunks(pairs: BoundPair[], sourceUrl: string): string[] {
  if (!pairs || !pairs.length) return [];

  let where = sourceUrl || "";
  try {
    const u = new URL(sourceUrl);
    where = u.hostname.replace(/^www\./, "") + (u.pathname === "/" ? "" : u.pathname);
  } catch {
    /* a non-URL source is still worth printing verbatim */
  }

  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of pairs) {
    const label = String(p && p.label ? p.label : "").replace(/\s+/g, " ").trim();
    const value = String(p && p.value ? p.value : "").replace(/\s+/g, " ").trim();
    if (!label || !value) continue;

    const key = label.toLowerCase() + "\u0000" + value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    // "Price" only when the value actually carries an amount; specification
    // tables bind things like "16 GB" that are values but not prices.
    const isPrice = /[$€£¥₹₫₩¢]|USD|EUR|GBP|JPY|INR/i.test(value);
    out.push(
      `Plan: ${label}\n${isPrice ? "Price" : "Value"}: ${value}` +
        (where ? `\nSource: ${where}` : "")
    );
  }
  return out;
}

/**
 * Canonical form for de-duplication.
 *
 * 18 URLs in chatbots-data were stored twice because only the exact string was
 * compared: floatco.com and floatco.com/ were treated as different pages, and
 * each one consumed a slot of the customer's crawl allowance.
 */
export function normalizeUrl(raw: string): string | null {
  try {
    const u = new URL(raw);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    u.protocol = "https:";
    u.hostname = u.hostname.toLowerCase().replace(/^www\./, "");
    u.hash = "";
    // tracking parameters do not change the page
    // Array.from rather than spread: the project targets below es2015, where
    // spreading an iterator does not compile
    const params: string[] = [];
    u.searchParams.forEach((_v, k) => params.push(k));
    for (const p of params) {
      if (/^(utm_|fbclid|gclid|msclkid|ref|mc_cid|mc_eid)/i.test(p)) u.searchParams.delete(p);
    }
    u.searchParams.sort();
    if (u.pathname !== "/" && u.pathname.endsWith("/")) u.pathname = u.pathname.slice(0, -1);
    return u.href;
  } catch {
    return null;
  }
}

const SKIP_EXTENSIONS =
  /\.(mp4|mp3|avi|mov|wmv|jpg|jpeg|png|gif|svg|webp|ico|pdf|zip|rar|gz|css|js|woff2?|ttf|eot)$/i;

/**
 * Should this link be crawled?
 *
 * The previous rule was `href.startsWith(baseUrl)`. When a customer entered a
 * URL containing a path - https://site.com/index.php - every sibling link
 * failed the prefix test and the crawl stopped at one page. The same happened
 * when a domain redirected, because links then pointed at the landing host.
 * Both cases were silent: the crawl reported success with a single page.
 *
 * `siteHost` must be the host the seed actually LANDED on, after redirects.
 */
export function shouldCrawl(href: string, siteHost: string): boolean {
  const normalized = normalizeUrl(href);
  if (!normalized) return false;
  try {
    const u = new URL(normalized);
    if (u.hostname !== siteHost.toLowerCase().replace(/^www\./, "")) return false;
    if (SKIP_EXTENSIONS.test(u.pathname)) return false;
    return true;
  } catch {
    return false;
  }
}
