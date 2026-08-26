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
 * Split on document structure, with size as a ceiling rather than the rule.
 *
 * The previous implementation sliced every 1800 characters regardless of
 * content, which cut 37.6% of chunk boundaries mid-word and split FAQ answers
 * across two chunks. `min` matters as much as `max`: splitting on every heading
 * alone turned one documentation page into 216 fragments, most a line long.
 */
export function chunkPageText(markdown: string, max = 2000, min = 400): string[] {
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
