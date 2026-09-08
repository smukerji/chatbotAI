/**
 * Site-level fact extraction for RAG ingest.
 *
 * Contact / org facts usually live in footer and sitewide chrome. The crawl
 * pipeline strips those from page chunks (good for content precision). This
 * module reads raw HTML *before* that strip and produces a small, deduped set
 * of fact vectors so phones, emails, WhatsApp, addresses, and hours remain
 * retrievable for any site — no brand allowlists.
 */

import { createHash } from "crypto";
import { parse } from "node-html-parser";

export type SiteFactType =
  | "phone"
  | "email"
  | "whatsapp"
  | "address"
  | "hours"
  | "other";

export type SiteFact = {
  type: SiteFactType;
  value: string;
  label: string;
  sourceUrl: string;
  /** Digits-only / lowercased key for dedupe */
  normalized: string;
};

const MAX_FACTS_PER_PAGE = 40;
const MAX_FACTS_PER_CRAWL = 200;

const PHONE_RE =
  /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{3,4}[\s.-]?\d{3,4}(?:\s*(?:ext|x|extension)\.?\s*\d+)?/i;
const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;

function sourceHint(sourceUrl: string): string {
  try {
    const u = new URL(sourceUrl);
    return (
      u.hostname.replace(/^www\./, "") +
      (u.pathname === "/" ? "" : u.pathname.replace(/\/$/, ""))
    );
  } catch {
    return sourceUrl || "";
  }
}

export function normalizePhone(raw: string): string {
  const digits = String(raw || "").replace(/\D/g, "");
  return digits;
}

export function normalizeEmail(raw: string): string {
  return String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/^mailto:/i, "");
}

function decodeHrefValue(href: string, prefix: string): string {
  try {
    return decodeURIComponent(href.slice(prefix.length).split("?")[0].trim());
  } catch {
    return href.slice(prefix.length).split("?")[0].trim();
  }
}

function pushFact(
  out: SiteFact[],
  fact: Omit<SiteFact, "normalized"> & { normalized?: string }
): void {
  const normalized =
    fact.normalized ||
    (fact.type === "email"
      ? normalizeEmail(fact.value)
      : fact.type === "phone" || fact.type === "whatsapp"
        ? normalizePhone(fact.value)
        : fact.value.trim().toLowerCase().replace(/\s+/g, " "));

  if (!normalized || normalized.length < 3) return;
  if (
    (fact.type === "phone" || fact.type === "whatsapp") &&
    normalized.length < 7
  ) {
    return;
  }

  out.push({
    type: fact.type,
    value: fact.value.trim(),
    label: fact.label.trim() || fact.type,
    sourceUrl: fact.sourceUrl,
    normalized,
  });
}

function extractFromAnchors(html: string, sourceUrl: string, out: SiteFact[]) {
  const root = parse(html, { comment: false });
  for (const a of root.querySelectorAll("a[href]")) {
    if (out.length >= MAX_FACTS_PER_PAGE) break;
    const href = (a.getAttribute("href") || "").trim();
    if (!href) continue;
    const lower = href.toLowerCase();
    const anchorText = (a.text || "").replace(/\s+/g, " ").trim();

    if (lower.startsWith("tel:")) {
      const value = decodeHrefValue(href, "tel:");
      pushFact(out, {
        type: "phone",
        value,
        label: anchorText || "Phone",
        sourceUrl,
      });
      continue;
    }

    if (lower.startsWith("mailto:")) {
      const value = decodeHrefValue(href, "mailto:");
      pushFact(out, {
        type: "email",
        value,
        label: anchorText || "Email",
        sourceUrl,
      });
      continue;
    }

    let waMatch = lower.match(
      /(?:wa\.me\/|api\.whatsapp\.com\/send\?phone=)(\+?\d{7,15})/i
    );
    if (!waMatch) {
      waMatch = href.match(/[?&]phone=(\+?\d{7,15})/i);
    }
    if (waMatch) {
      pushFact(out, {
        type: "whatsapp",
        value: waMatch[1],
        label: anchorText || "WhatsApp",
        sourceUrl,
      });
    }
  }
}

function walkJsonLd(node: unknown, sourceUrl: string, out: SiteFact[]) {
  if (!node || out.length >= MAX_FACTS_PER_PAGE) return;

  if (Array.isArray(node)) {
    for (const item of node) walkJsonLd(item, sourceUrl, out);
    return;
  }

  if (typeof node !== "object") return;
  const obj = node as Record<string, unknown>;
  const typeRaw = obj["@type"];
  const types = (
    Array.isArray(typeRaw) ? typeRaw : [typeRaw]
  ).map((t) => String(t || "").toLowerCase());

  const isContactish = types.some((t) =>
    /organization|localbusiness|store|restaurant|hotel|place|contactpoint|person/.test(
      t
    )
  );

  if (isContactish || obj.telephone || obj.email || obj.address) {
    if (typeof obj.telephone === "string") {
      pushFact(out, {
        type: "phone",
        value: obj.telephone,
        label: "Phone",
        sourceUrl,
      });
    }
    if (typeof obj.email === "string") {
      pushFact(out, {
        type: "email",
        value: obj.email,
        label: "Email",
        sourceUrl,
      });
    }
    if (typeof obj.address === "string") {
      pushFact(out, {
        type: "address",
        value: obj.address,
        label: "Address",
        sourceUrl,
      });
    } else if (obj.address && typeof obj.address === "object") {
      const a = obj.address as Record<string, unknown>;
      const parts = [
        a.streetAddress,
        a.addressLocality,
        a.addressRegion,
        a.postalCode,
        a.addressCountry,
      ]
        .filter((p) => typeof p === "string" && p.trim())
        .join(", ");
      if (parts) {
        pushFact(out, {
          type: "address",
          value: parts,
          label: "Address",
          sourceUrl,
        });
      }
    }
    if (typeof obj.openingHours === "string") {
      pushFact(out, {
        type: "hours",
        value: obj.openingHours,
        label: "Hours",
        sourceUrl,
      });
    }
    if (Array.isArray(obj.openingHours)) {
      const hours = obj.openingHours.filter((h) => typeof h === "string").join("; ");
      if (hours) {
        pushFact(out, {
          type: "hours",
          value: hours,
          label: "Hours",
          sourceUrl,
        });
      }
    }
  }

  if (obj.contactPoint) walkJsonLd(obj.contactPoint, sourceUrl, out);
  if (obj["@graph"]) walkJsonLd(obj["@graph"], sourceUrl, out);
  for (const v of Object.values(obj)) {
    if (v && typeof v === "object") walkJsonLd(v, sourceUrl, out);
  }
}

function extractFromJsonLd(html: string, sourceUrl: string, out: SiteFact[]) {
  const root = parse(html, { comment: false });
  for (const script of root.querySelectorAll(
    'script[type="application/ld+json"]'
  )) {
    if (out.length >= MAX_FACTS_PER_PAGE) break;
    const raw = (script.text || "").trim();
    if (!raw) continue;
    try {
      walkJsonLd(JSON.parse(raw), sourceUrl, out);
    } catch {
      /* ignore malformed JSON-LD */
    }
  }
}

/** Strip tags lightly for labeled text scan (keep link text and punctuation). */
function htmlToLooseText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|tr|h[1-6]|section|article|footer|header)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/[ \t]+/g, " ")
    .replace(/\n+/g, "\n")
    .trim();
}

function extractFromLabeledText(
  html: string,
  sourceUrl: string,
  out: SiteFact[]
) {
  const text = htmlToLooseText(html);
  const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean);

  const labeled: Array<{
    re: RegExp;
    type: SiteFactType;
    defaultLabel: string;
    valueOk?: (value: string) => boolean;
  }> = [
    {
      re: /\b(?:phone|tel|telephone)\s*[:.#]\s*([+\d(][\d\s().-]{6,}\d)/i,
      type: "phone",
      defaultLabel: "Phone",
    },
    {
      re: /\bwhatsapp\s*[:.#]\s*([+\d(][\d\s().-]{6,}\d)/i,
      type: "whatsapp",
      defaultLabel: "WhatsApp",
    },
    {
      re: /\b(?:e-?mail)\s*[:.#]\s*([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})/i,
      type: "email",
      defaultLabel: "Email",
    },
    {
      re: /\b(?:address|located\s+at)\s*[:.#]\s*(.{8,160}?)(?:\s{2,}|\n|$)/i,
      type: "address",
      defaultLabel: "Address",
      valueOk: (v) =>
        /\d/.test(v) &&
        !/\b(involves|includes|learn|chronic|therapy)\b/i.test(v),
    },
    {
      re: /\b(?:opening\s*hours?|business\s*hours|hours\s*of\s*operation)\s*[:.#]\s*(.{5,120}?)(?:\s{2,}|\n|$)/i,
      type: "hours",
      defaultLabel: "Hours",
      valueOk: (v) =>
        /\d{1,2}\s*[:.]\s*\d{2}|\d{1,2}\s*(am|pm)|mon|tue|wed|thu|fri|sat|sun/i.test(
          v
        ),
    },
  ];

  for (const line of lines) {
    if (out.length >= MAX_FACTS_PER_PAGE) break;
    if (line.length > 280) continue;
    for (const rule of labeled) {
      const m = line.match(rule.re);
      if (!m?.[1]) continue;
      let value = m[1].trim();
      if (rule.type === "phone" || rule.type === "whatsapp") {
        const phone = value.match(PHONE_RE);
        if (!phone) continue;
        value = phone[0].trim();
      }
      if (rule.type === "email") {
        const email = value.match(EMAIL_RE);
        if (!email) continue;
        value = email[0];
      }
      if (rule.valueOk && !rule.valueOk(value)) continue;
      pushFact(out, {
        type: rule.type,
        value,
        label: rule.defaultLabel,
        sourceUrl,
      });
    }
  }
}

/**
 * Extract site facts from a single page's raw HTML (before footer strip).
 */
export function extractSiteFactsFromHtml(
  html: string,
  sourceUrl: string
): SiteFact[] {
  if (!html?.trim()) return [];
  const out: SiteFact[] = [];
  try {
    extractFromAnchors(html, sourceUrl, out);
    extractFromJsonLd(html, sourceUrl, out);
    extractFromLabeledText(html, sourceUrl, out);
  } catch (err) {
    console.warn("[site-facts] extract failed", sourceUrl, err);
  }
  return dedupeSiteFacts(out).slice(0, MAX_FACTS_PER_PAGE);
}

/** Dedupe by type + normalized value; keep first source URL. */
export function dedupeSiteFacts(facts: SiteFact[]): SiteFact[] {
  const seen = new Set<string>();
  const out: SiteFact[] = [];
  for (const f of facts) {
    if (!f?.normalized) continue;
    const key = `${f.type}::${f.normalized}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(f);
    if (out.length >= MAX_FACTS_PER_CRAWL) break;
  }
  return out;
}

/** Collect facts attached to crawl page objects. */
export function collectSiteFactsFromCrawl(
  crawledList: Array<{ siteFacts?: SiteFact[] } | null | undefined>
): SiteFact[] {
  const all: SiteFact[] = [];
  for (const page of crawledList || []) {
    if (Array.isArray(page?.siteFacts)) all.push(...page.siteFacts);
  }
  return dedupeSiteFacts(all);
}

export function formatSiteFactEmbedText(fact: SiteFact): string {
  const where = sourceHint(fact.sourceUrl);
  const canonical: Record<SiteFactType, string> = {
    phone: "Phone",
    email: "Email",
    whatsapp: "WhatsApp",
    address: "Address",
    hours: "Hours",
    other: "Fact",
  };
  const label = canonical[fact.type] || fact.label || fact.type;
  return `${label}: ${fact.value}.${where ? ` Source: ${where}` : ""}`;
}

/** Stable Pinecone id so backfill / re-crawl upserts are idempotent. */
export function siteFactVectorId(chatbotId: string, fact: SiteFact): string {
  const digest = createHash("sha256")
    .update(`${chatbotId}|${fact.type}|${fact.normalized}`)
    .digest("hex")
    .slice(0, 32);
  return `sitefact-${digest}`;
}
