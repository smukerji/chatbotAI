/**
 * Broad extractor comparison across the stratified corpus.
 *
 * Ground truth is what a human sees: document.body.innerText from the rendered
 * page. Every extractor is scored against that, so no hand-annotation is needed
 * and the scoring is reproducible.
 *
 * Metrics per (page, extractor):
 *   recall      - share of >=6-word sentences from innerText that survive
 *   numbersKept - share of currency/number tokens that survive (the pricing failure)
 *   glued       - lowercase->uppercase with no separator, per 1k chars
 *   midWord     - chunk boundaries starting mid-word
 *   imageChars  - chars spent on image URLs
 *   headings    - markdown headings produced (structure available for chunking)
 *   mdTables    - markdown tables produced
 *   boilerShare - share of output that repeats across that site's other pages
 *
 *   node evals-crawler/09-broad-bakeoff.js [--site floatco] [--limit 3]
 */

const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const { parse } = require("node-html-parser");
const TurndownService = require("turndown");
const { gfm } = require("turndown-plugin-gfm");
const { Readability } = require("@mozilla/readability");
const { JSDOM } = require("jsdom");

const OUT = path.join(__dirname, "results");
const CORPUS = JSON.parse(fs.readFileSync(path.join(__dirname, "corpus.json"), "utf8"));

// ── production code, verbatim from route.ts ─────────────────────────────────
const imageLinkRegex =
  /^https?:\/\/(?:[\w\-]+\.)+[a-zA-Z]{2,20}(?:\/[^\s?]+)*(?:\.(?:jpg|jpeg|png|gif|bmp|svg|webp|tiff))(?:\?.*)?$/i;

function extractTextAndImageSrc(element) {
  if (element.tagName === "SCRIPT" || element.tagName === "SVG" || element.tagName === "STYLE") return "";
  if (element.tagName === "IMG") {
    const src = element.getAttribute("src");
    if (imageLinkRegex.test(src)) return `      image: ${decodeURI(src)}          `;
    return "";
  }
  if (element.childNodes.length === 0) return element.text;
  let text = "";
  element.childNodes.forEach((c) => (text += extractTextAndImageSrc(c)));
  return text.replace(/(\r\n|\n|\r|\t|)/gm, "").trim();
}

function windowChunks(text, size = 2000, step = 1800) {
  const out = [];
  for (let s = 0; s < text.length; s += step) out.push(text.substring(s, s + size));
  return out;
}

function markdownChunks(md, max = 2000) {
  const out = [];
  for (const section of md.split(/\n(?=#{1,6}\s)/)) {
    if (section.length <= max) {
      if (section.trim()) out.push(section.trim());
      continue;
    }
    let buf = "";
    for (const para of section.split(/\n{2,}/)) {
      if (buf && (buf + "\n\n" + para).length > max) {
        out.push(buf.trim());
        buf = para;
      } else buf = buf ? buf + "\n\n" + para : para;
    }
    if (buf.trim()) out.push(buf.trim());
  }
  return out;
}

function makeTurndown() {
  const td = new TurndownService({ headingStyle: "atx" });
  td.use(gfm);
  td.remove(["script", "style", "noscript", "iframe", "svg"]);
  td.addRule("dropImages", { filter: "img", replacement: () => "" });
  return td;
}

// ── scoring ─────────────────────────────────────────────────────────────────
const normalise = (s) => s.toLowerCase().replace(/[^a-z0-9$.,%\s]/g, " ").replace(/\s+/g, " ").trim();

function sentencesOf(text) {
  return normalise(text)
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.split(" ").length >= 6);
}

/** did this sentence survive? compare on a 6-word shingle so formatting differences don't count as loss */
function recallScore(truthText, outText) {
  const out = normalise(outText);
  const sents = sentencesOf(truthText);
  if (!sents.length) return null;
  let kept = 0;
  for (const s of sents) {
    const words = s.split(" ");
    const probe = words.slice(0, 6).join(" ");
    if (out.includes(probe)) kept++;
  }
  return kept / sents.length;
}

const NUM_RE = /(?:[$€£¥]\s?\d[\d,.]*|\b\d[\d,.]*\s?(?:%|usd|eur|gbp|hkd)\b)/gi;
function numbersKept(truthText, outText) {
  const truth = [...new Set((truthText.match(NUM_RE) || []).map((s) => s.replace(/\s+/g, "")))];
  if (!truth.length) return null;
  const out = outText.replace(/\s+/g, "");
  return truth.filter((n) => out.includes(n)).length / truth.length;
}

function measure(text, chunks) {
  let midWord = 0;
  for (let i = 1; i < chunks.length; i++) {
    if (/[A-Za-z]/.test(chunks[i - 1].slice(-1)) && /[a-z]/.test(chunks[i][0] || "")) midWord++;
  }
  return {
    chars: text.length,
    chunks: chunks.length,
    gluedPer1k: text.length ? ((text.match(/[a-z][A-Z]/g) || []).length / text.length) * 1000 : 0,
    midWordPct: chunks.length > 1 ? (midWord / (chunks.length - 1)) * 100 : 0,
    imageChars: (text.match(/image:\s*https?:\/\/\S+/g) || []).reduce((a, s) => a + s.length, 0),
    headings: (text.match(/^#{1,6}\s/gm) || []).length,
    mdTables: (text.match(/^\|.+\|$/gm) || []).length,
  };
}

function shingles(text, n = 8) {
  const w = normalise(text).split(" ");
  const set = new Set();
  for (let i = 0; i + n <= w.length; i++) set.add(w.slice(i, i + n).join(" "));
  return set;
}

// ── run ─────────────────────────────────────────────────────────────────────
(async () => {
  const args = process.argv.slice(2);
  const siteFilter = args.includes("--site") ? args[args.indexOf("--site") + 1] : null;
  const limit = args.includes("--limit") ? Number(args[args.indexOf("--limit") + 1]) : 3;

  const { Defuddle } = await import("defuddle/node");
  const td = makeTurndown();
  fs.mkdirSync(OUT, { recursive: true });

  const sites = CORPUS.sites.filter((s) => !siteFilter || s.id === siteFilter);
  const browser = await puppeteer.launch({ headless: "new" });
  const rows = [];

  for (const site of sites) {
    const perExtractorTexts = {};
    for (const url of site.urls.slice(0, limit)) {
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 900 });
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36"
      );

      const base = { site: site.id, stack: site.stack, rendering: site.rendering, type: site.type, tables: site.tables, lang: site.lang, url };
      let truth, bodyHtml, fullHtml;
      try {
        await page.goto(url, { waitUntil: "networkidle2", timeout: 45000 });
        truth = await page.evaluate(() => document.body.innerText || "");
        bodyHtml = await page.$eval("body", (b) => b.innerHTML);
        fullHtml = await page.content();
      } catch (e) {
        rows.push({ ...base, extractor: "-", error: String(e.message).slice(0, 120) });
        await page.close();
        console.log(`  ERROR ${url} :: ${String(e.message).slice(0, 60)}`);
        continue;
      }
      await page.close();

      const candidates = {};

      // A production
      try {
        const t = extractTextAndImageSrc(parse(bodyHtml)).replace(/<img[^>]*>/g, "");
        candidates.production = { text: t, chunks: windowChunks(t) };
      } catch (e) { candidates.production = { error: e.message }; }

      // B turndown on full body
      try {
        const t = td.turndown(bodyHtml);
        candidates.turndown = { text: t, chunks: markdownChunks(t) };
      } catch (e) { candidates.turndown = { error: e.message }; }

      // C readability + turndown
      try {
        const doc = new JSDOM(fullHtml, { url }).window.document;
        const art = new Readability(doc).parse();
        const t = art ? td.turndown(art.content) : "";
        candidates.readability = { text: t, chunks: markdownChunks(t) };
      } catch (e) { candidates.readability = { error: e.message }; }

      // D defuddle
      try {
        const dom = new JSDOM(fullHtml, { url });
        const res = await Defuddle(dom, url, { markdown: true });
        const t = res?.content || "";
        candidates.defuddle = { text: t, chunks: markdownChunks(t) };
      } catch (e) { candidates.defuddle = { error: e.message }; }

      for (const [name, c] of Object.entries(candidates)) {
        if (c.error) {
          rows.push({ ...base, extractor: name, error: c.error.slice(0, 120) });
          continue;
        }
        (perExtractorTexts[name] ||= []).push(c.text);
        rows.push({
          ...base,
          extractor: name,
          recall: recallScore(truth, c.text),
          numbersKept: numbersKept(truth, c.text),
          truthChars: truth.length,
          ...measure(c.text, c.chunks),
        });
      }

      console.log(
        `${site.id.padEnd(14)} ${Object.entries(candidates)
          .map(([n, c]) => `${n[0]}${c.error ? "!" : Math.round((recallScore(truth, c.text) || 0) * 100)}`)
          .join(" ")}  ${url.slice(0, 58)}`
      );
    }

    // save after every site so a later hang cannot lose completed work
    fs.writeFileSync(path.join(OUT, "broad-bakeoff.json"), JSON.stringify(rows, null, 2));

    // cross-page repetition per extractor
    for (const [name, texts] of Object.entries(perExtractorTexts)) {
      if (texts.length < 2) continue;
      const sets = texts.map((t) => shingles(t));
      const counts = new Map();
      for (const s of sets) for (const sh of s) counts.set(sh, (counts.get(sh) || 0) + 1);
      const thr = Math.ceil(texts.length * 0.6);
      const repeated = new Set([...counts].filter(([, c]) => c >= thr).map(([s]) => s));
      const shares = sets.map((s) => (s.size ? [...s].filter((x) => repeated.has(x)).length / s.size : 0));
      const mean = shares.reduce((a, b) => a + b, 0) / shares.length;
      for (const r of rows) if (r.site === site.id && r.extractor === name) r.boilerShare = mean;
    }
  }

  await browser.close();
  fs.writeFileSync(path.join(OUT, "broad-bakeoff.json"), JSON.stringify(rows, null, 2));
  console.log(`\n-> ${path.join(OUT, "broad-bakeoff.json")}  (${rows.length} rows)`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
