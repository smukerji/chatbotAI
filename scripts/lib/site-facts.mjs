/**
 * JS mirror of src/app/_helpers/server/site-facts.ts for Node scripts.
 * Keep behavior aligned when changing the TypeScript source.
 */
import { createHash } from "crypto";
import { parse } from "node-html-parser";

const MAX_FACTS_PER_PAGE = 40;
const MAX_FACTS_PER_CRAWL = 200;

const PHONE_RE =
  /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{3,4}[\s.-]?\d{3,4}(?:\s*(?:ext|x|extension)\.?\s*\d+)?/i;
const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;

export function normalizePhone(raw) {
  return String(raw || "").replace(/\D/g, "");
}

export function normalizeEmail(raw) {
  return String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/^mailto:/i, "");
}

function sourceHint(sourceUrl) {
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

function decodeHrefValue(href, prefix) {
  try {
    return decodeURIComponent(href.slice(prefix.length).split("?")[0].trim());
  } catch {
    return href.slice(prefix.length).split("?")[0].trim();
  }
}

function pushFact(out, fact) {
  const normalized =
    fact.normalized ||
    (fact.type === "email"
      ? normalizeEmail(fact.value)
      : fact.type === "phone" || fact.type === "whatsapp"
        ? normalizePhone(fact.value)
        : String(fact.value || "")
            .trim()
            .toLowerCase()
            .replace(/\s+/g, " "));

  if (!normalized || normalized.length < 3) return;
  if (
    (fact.type === "phone" || fact.type === "whatsapp") &&
    normalized.length < 7
  ) {
    return;
  }

  out.push({
    type: fact.type,
    value: String(fact.value || "").trim(),
    label: String(fact.label || fact.type).trim(),
    sourceUrl: fact.sourceUrl,
    normalized,
  });
}

function extractFromAnchors(html, sourceUrl, out) {
  const root = parse(html, { comment: false });
  for (const a of root.querySelectorAll("a[href]")) {
    if (out.length >= MAX_FACTS_PER_PAGE) break;
    const href = (a.getAttribute("href") || "").trim();
    if (!href) continue;
    const lower = href.toLowerCase();
    const anchorText = (a.text || "").replace(/\s+/g, " ").trim();

    if (lower.startsWith("tel:")) {
      pushFact(out, {
        type: "phone",
        value: decodeHrefValue(href, "tel:"),
        label: anchorText || "Phone",
        sourceUrl,
      });
      continue;
    }
    if (lower.startsWith("mailto:")) {
      pushFact(out, {
        type: "email",
        value: decodeHrefValue(href, "mailto:"),
        label: anchorText || "Email",
        sourceUrl,
      });
      continue;
    }

    let waMatch = lower.match(
      /(?:wa\.me\/|api\.whatsapp\.com\/send\?phone=)(\+?\d{7,15})/i
    );
    if (!waMatch) waMatch = href.match(/[?&]phone=(\+?\d{7,15})/i);
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

function walkJsonLd(node, sourceUrl, out) {
  if (!node || out.length >= MAX_FACTS_PER_PAGE) return;
  if (Array.isArray(node)) {
    for (const item of node) walkJsonLd(item, sourceUrl, out);
    return;
  }
  if (typeof node !== "object") return;
  const obj = node;
  const typeRaw = obj["@type"];
  const types = (Array.isArray(typeRaw) ? typeRaw : [typeRaw]).map((t) =>
    String(t || "").toLowerCase()
  );
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
      const a = obj.address;
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
      const hours = obj.openingHours
        .filter((h) => typeof h === "string")
        .join("; ");
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

function extractFromJsonLd(html, sourceUrl, out) {
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
      /* ignore */
    }
  }
}

function htmlToLooseText(html) {
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

function extractFromLabeledText(html, sourceUrl, out) {
  const text = htmlToLooseText(html);
  const lines = text
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);

  const labeled = [
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

export function dedupeSiteFacts(facts) {
  const seen = new Set();
  const out = [];
  for (const f of facts || []) {
    if (!f?.normalized) continue;
    const key = `${f.type}::${f.normalized}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(f);
    if (out.length >= MAX_FACTS_PER_CRAWL) break;
  }
  return out;
}

export function extractSiteFactsFromHtml(html, sourceUrl) {
  if (!html?.trim()) return [];
  const out = [];
  try {
    extractFromAnchors(html, sourceUrl, out);
    extractFromJsonLd(html, sourceUrl, out);
    extractFromLabeledText(html, sourceUrl, out);
  } catch (err) {
    console.warn("[site-facts] extract failed", sourceUrl, err?.message || err);
  }
  return dedupeSiteFacts(out).slice(0, MAX_FACTS_PER_PAGE);
}

export function formatSiteFactEmbedText(fact) {
  const where = sourceHint(fact.sourceUrl);
  const canonical = {
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

export function siteFactVectorId(chatbotId, fact) {
  const digest = createHash("sha256")
    .update(`${chatbotId}|${fact.type}|${fact.normalized}`)
    .digest("hex")
    .slice(0, 32);
  return `sitefact-${digest}`;
}
