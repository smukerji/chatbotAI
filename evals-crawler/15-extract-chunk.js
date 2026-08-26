/**
 * Stages 2 and 3 - extraction and chunking, as a 2x2 on identical input.
 *
 *   extractor: production  | turndown
 *   chunker:   fixed 2000  | markdown-structure
 *
 * Pages are fetched once with Crawlee and reused for all four combinations, so
 * differences come from processing rather than from crawling different pages.
 *
 * The metric that matters is label-value adjacency. On a flattened CSS-grid
 * table the labels come out in a run followed by the prices in a run, so a
 * price sits far from the label it belongs to with other labels in between.
 * Alternation measures that without needing ground truth: in a well-formed
 * table LABEL and PRICE alternate; in a flattened one they cluster.
 *
 *   node evals-crawler/15-extract-chunk.js
 *   node evals-crawler/15-extract-chunk.js --site floatco
 */

const fs = require("fs");
const path = require("path");
const { parse } = require("node-html-parser");
const TurndownService = require("turndown");
const { gfm } = require("turndown-plugin-gfm");

const OUT = path.join(__dirname, "results");

const SITES = [
  { id: "floatco", url: "https://floatco.com/pricing", type: "pricing" },
  { id: "floatco-faq", url: "https://floatco.com/faq", type: "faq" },
  { id: "vercel", url: "https://vercel.com/pricing", type: "pricing" },
  { id: "gov-uk", url: "https://www.gov.uk/income-tax-rates", type: "rates" },
  { id: "livall", url: "https://livall.com/products/bh51m", type: "product" },
  { id: "w3schools", url: "https://www.w3schools.com/html/html_tables.asp", type: "docs" },
];

// ── production extractor + chunker, verbatim from route.ts ───────────────────
const imageLinkRegex =
  /^https?:\/\/(?:[\w\-]+\.)+[a-zA-Z]{2,20}(?:\/[^\s?]+)*(?:\.(?:jpg|jpeg|png|gif|bmp|svg|webp|tiff))(?:\?.*)?$/i;

function extractProduction(element) {
  if (element.tagName === "SCRIPT" || element.tagName === "SVG" || element.tagName === "STYLE") return "";
  if (element.tagName === "IMG") {
    const src = element.getAttribute("src");
    if (imageLinkRegex.test(src)) return `      image: ${decodeURI(src)}          `;
    return "";
  }
  if (element.childNodes.length === 0) return element.text;
  let text = "";
  element.childNodes.forEach((c) => (text += extractProduction(c)));
  return text.replace(/(\r\n|\n|\r|\t|)/gm, "").trim();
}

function chunkFixed(text) {
  const out = [];
  for (let s = 0; s < text.length; s += 1800) out.push(text.substring(s, s + 2000));
  return out;
}

/**
 * Split on headings, then paragraphs, with size as a ceiling rather than the
 * rule. `min` matters as much as `max`: an earlier version split on every
 * heading and turned one w3schools page into 216 fragments, most of them a
 * line long. Small adjacent sections are merged back up to `max`.
 */
function chunkMarkdown(md, max = 2000, min = 400) {
  const parts = [];
  for (const section of md.split(/\n(?=#{1,6}\s)/)) {
    if (section.length <= max) {
      if (section.trim()) parts.push(section.trim());
      continue;
    }
    let buf = "";
    for (const para of section.split(/\n{2,}/)) {
      if (buf && (buf + "\n\n" + para).length > max) {
        parts.push(buf.trim());
        buf = para;
      } else buf = buf ? buf + "\n\n" + para : para;
    }
    if (buf.trim()) parts.push(buf.trim());
  }

  // merge undersized neighbours so retrieval sees coherent passages
  const out = [];
  for (const p of parts) {
    const last = out[out.length - 1];
    if (last && last.length < min && (last + "\n\n" + p).length <= max) {
      out[out.length - 1] = last + "\n\n" + p;
    } else {
      out.push(p);
    }
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

// ── metrics ──────────────────────────────────────────────────────────────────

const PRICE_RE = /[$£€]\s?\d[\d,]*(?:\.\d+)?/g;

/**
 * Do labels and prices alternate, or do they cluster?
 *
 * Walk the text, emit L for a phrase of 2+ words and P for a currency amount,
 * then measure how often a P directly follows an L. A real table alternates
 * (LPLPLP); a flattened grid clusters (LLLPPP), which is exactly the FloatCo
 * failure - the price ends up nowhere near the plan it belongs to.
 */
function alternation(text) {
  const tokens = [];
  const re = /([$£€]\s?\d[\d,]*(?:\.\d+)?)|([A-Za-z][A-Za-z'’-]*(?:\s+[A-Za-z][A-Za-z'’-]*){1,8})/g;
  let m;
  while ((m = re.exec(text)) !== null) tokens.push(m[1] ? "P" : "L");
  const prices = tokens.filter((t) => t === "P").length;
  if (prices < 2) return null;
  let lp = 0;
  for (let i = 1; i < tokens.length; i++) if (tokens[i] === "P" && tokens[i - 1] === "L") lp++;
  return lp / prices; // 1.0 = every price directly preceded by a label
}

/** mean characters between each price and the nearest preceding word-phrase */
function priceLabelDistance(text) {
  const dists = [];
  let m;
  const re = new RegExp(PRICE_RE.source, "g");
  while ((m = re.exec(text)) !== null) {
    const before = text.slice(Math.max(0, m.index - 300), m.index);
    const lastWord = before.search(/[A-Za-z][A-Za-z'’-]{2,}(?![\s\S]*[A-Za-z]{3})/);
    const tail = before.match(/[A-Za-z][A-Za-z'’ -]{3,}$/);
    dists.push(tail ? 0 : before.length - before.lastIndexOf(" "));
  }
  if (!dists.length) return null;
  return dists.reduce((a, b) => a + b, 0) / dists.length;
}

function midWordPct(chunks) {
  if (chunks.length < 2) return 0;
  let bad = 0;
  for (let i = 1; i < chunks.length; i++) {
    if (/[A-Za-z]/.test(chunks[i - 1].slice(-1)) && /[a-z]/.test(chunks[i][0] || "")) bad++;
  }
  return (bad / (chunks.length - 1)) * 100;
}

/** FAQ integrity: does a numbered question keep its answer in the same chunk? */
function qaSplit(chunks) {
  const qRe = /\b\d{1,3}\.\s+[A-Z][^?]{5,120}\?/g;
  let total = 0,
    orphaned = 0;
  for (const c of chunks) {
    const qs = c.match(qRe) || [];
    for (const q of qs) {
      total++;
      const after = c.slice(c.indexOf(q) + q.length);
      if (after.trim().length < 80) orphaned++; // question at the very end, answer elsewhere
    }
  }
  return total ? { total, orphaned, pct: (orphaned / total) * 100 } : null;
}

(async () => {
  const siteFilter = process.argv.includes("--site")
    ? process.argv[process.argv.indexOf("--site") + 1]
    : null;
  const sites = SITES.filter((s) => !siteFilter || s.id === siteFilter);
  fs.mkdirSync(OUT, { recursive: true });

  const { PlaywrightCrawler, Configuration } = require("crawlee");
  const td = makeTurndown();
  const rows = [];

  for (const site of sites) {
    let html = null;
    const crawler = new PlaywrightCrawler(
      {
        maxRequestsPerCrawl: 1,
        maxRequestRetries: 1,
        navigationTimeoutSecs: 45,
        headless: true,
        preNavigationHooks: [async (_c, g) => { g.waitUntil = "domcontentloaded"; }],
        async requestHandler({ page }) {
          let prev = -1;
          for (let i = 0; i < 6; i++) {
            const n = await page.evaluate(() => (document.body.innerText || "").length);
            if (n === prev && n > 0) break;
            prev = n;
            await page.waitForTimeout(400);
          }
          html = await page.evaluate(() => document.body.innerHTML);
        },
      },
      new Configuration({ persistStorage: false })
    );
    await crawler.run([site.url]);
    if (!html) {
      console.log(`${site.id}: FETCH FAILED`);
      continue;
    }

    const prodText = extractProduction(parse(html)).replace(/<img[^>]*>/g, "");
    const mdText = td.turndown(html);

    const combos = [
      { name: "prod + fixed", text: prodText, chunks: chunkFixed(prodText) },
      { name: "prod + md", text: prodText, chunks: chunkMarkdown(prodText) },
      { name: "turndown + fixed", text: mdText, chunks: chunkFixed(mdText) },
      { name: "turndown + md", text: mdText, chunks: chunkMarkdown(mdText) },
    ];

    console.log(`\n=== ${site.id} (${site.type}) ===`);
    console.log(
      "  combo".padEnd(20) + "chunks".padStart(8) + "midWord".padStart(9) + "altern".padStart(8) + "prices".padStart(8)
    );
    for (const c of combos) {
      const alt = alternation(c.text);
      const prices = (c.text.match(new RegExp(PRICE_RE.source, "g")) || []).length;
      const row = {
        site: site.id,
        type: site.type,
        combo: c.name,
        chunks: c.chunks.length,
        chars: c.text.length,
        midWordPct: +midWordPct(c.chunks).toFixed(1),
        alternation: alt === null ? null : +alt.toFixed(3),
        prices,
        qa: qaSplit(c.chunks),
      };
      rows.push(row);
      console.log(
        "  " + c.name.padEnd(18) + String(row.chunks).padStart(8) +
        (row.midWordPct + "%").padStart(9) +
        (row.alternation === null ? "   -  " : String(row.alternation)).padStart(8) +
        String(prices).padStart(8)
      );
    }
    fs.writeFileSync(path.join(OUT, "extract-chunk.json"), JSON.stringify(rows, null, 2));
  }

  // aggregate
  console.log("\n" + "=".repeat(62));
  console.log("AGGREGATE".padEnd(20) + "midWord".padStart(10) + "alternation".padStart(14) + "chunks".padStart(9));
  console.log("=".repeat(62));
  for (const combo of ["prod + fixed", "prod + md", "turndown + fixed", "turndown + md"]) {
    const r = rows.filter((x) => x.combo === combo);
    const mw = r.reduce((a, b) => a + b.midWordPct, 0) / r.length;
    const alts = r.map((x) => x.alternation).filter((x) => x !== null);
    const al = alts.length ? alts.reduce((a, b) => a + b, 0) / alts.length : NaN;
    const ch = r.reduce((a, b) => a + b.chunks, 0);
    console.log(
      combo.padEnd(20) + (mw.toFixed(1) + "%").padStart(10) + al.toFixed(3).padStart(14) + String(ch).padStart(9)
    );
  }
  console.log("=".repeat(62));
  console.log(`\n-> ${path.join(OUT, "extract-chunk.json")}`);
})();
