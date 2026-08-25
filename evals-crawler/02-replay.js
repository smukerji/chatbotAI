/**
 * Replays real customer URLs through the PRODUCTION extraction pipeline and
 * measures, per page, where content is lost or polluted.
 *
 * extractTextAndImageSrc() and the chunk loop below are copied verbatim from
 * src/app/(secure)/home/fetch-links/api/route.ts so the numbers describe the
 * shipped code, not a re-implementation of it. Do not "improve" them here.
 *
 *   node evals-crawler/02-replay.js            # sampled pages
 *   node evals-crawler/02-replay.js --all      # every page in inventory.json
 *   node evals-crawler/02-replay.js --site floatco.com
 */

const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const { parse } = require("node-html-parser");

const OUT = path.join(__dirname, "results");
const INVENTORY = path.join(OUT, "inventory.json");

// ─────────────────────────────────────────────────────────────────────────────
// VERBATIM from route.ts L214-243
// ─────────────────────────────────────────────────────────────────────────────
const imageLinkRegex =
  /^https?:\/\/(?:[\w\-]+\.)+[a-zA-Z]{2,20}(?:\/[^\s?]+)*(?:\.(?:jpg|jpeg|png|gif|bmp|svg|webp|tiff))(?:\?.*)?$/i;

function extractTextAndImageSrc(element) {
  if (
    element.tagName === "SCRIPT" ||
    element.tagName === "SVG" ||
    element.tagName === "STYLE"
  ) {
    return "";
  } else if (element.tagName === "IMG") {
    const imgSrc = element.getAttribute("src");
    if (imageLinkRegex.test(imgSrc))
      return `      image: ${decodeURI(imgSrc)}          `;
    return "";
  } else if (element.childNodes.length === 0) {
    return element.text;
  } else {
    let text = "";
    element.childNodes.forEach((child) => {
      text += extractTextAndImageSrc(child);
    });
    return text.replace(/(\r\n|\n|\r|\t|)/gm, "").trim();
  }
}

/** VERBATIM chunk loop from route.ts L339-352, minus the Promise wrapper. */
function prodChunks(text) {
  const chunks = [];
  let start = 0;
  const end = text.length;
  while (start < end) {
    chunks.push(text.substring(start, start + 2000));
    start += 1800;
  }
  return chunks;
}

// ─────────────────────────────────────────────────────────────────────────────
// measurement helpers
// ─────────────────────────────────────────────────────────────────────────────

/** chars consumed by the "image: <url>" markers the extractor injects */
function imageMarkerChars(text) {
  const m = text.match(/ {6}image: \S+ {10}/g) || [];
  return { count: m.length, chars: m.reduce((a, s) => a + s.length, 0) };
}

/** lowercase→uppercase with no separator: "PricingContact". Proxy for lost word boundaries. */
function gluedWordCount(text) {
  return (text.match(/[a-z][A-Z]/g) || []).length;
}

/** % of chunks that begin mid-word (previous chunk ended on a letter) */
function midWordChunkStarts(chunks) {
  let bad = 0;
  for (let i = 1; i < chunks.length; i++) {
    const prevEnd = chunks[i - 1].slice(-1);
    const thisStart = chunks[i].slice(0, 1);
    if (/[A-Za-z]/.test(prevEnd) && /[a-z]/.test(thisStart)) bad++;
  }
  return { bad, of: Math.max(0, chunks.length - 1) };
}

/** 8-word shingles, for cross-page repetition analysis */
function shingles(text, n = 8) {
  const words = text.toLowerCase().replace(/\s+/g, " ").trim().split(" ");
  const out = new Set();
  for (let i = 0; i + n <= words.length; i++) out.add(words.slice(i, i + n).join(" "));
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────

const BOILERPLATE_SELECTORS = [
  "nav", "header", "footer", "aside", "form", "noscript", "iframe",
  "[role=navigation]", "[role=banner]", "[role=contentinfo]", "[role=search]",
  "[aria-label*=cookie i]", "[class*=cookie i]", "[id*=cookie i]",
  "[class*=consent i]", "[class*=newsletter i]", "[class*=breadcrumb i]",
  "[class*=sidebar i]", "[class*=menu i]", "[class*=nav i]",
];

/** measured in the live DOM: how much of body text sits inside boilerplate elements */
async function measureDom(page) {
  return page.evaluate((sels) => {
    const bodyText = (document.body.innerText || "").replace(/\s+/g, " ").trim();

    // characters inside boilerplate containers (deduped: skip nested matches)
    const nodes = [];
    for (const s of sels) {
      let found = [];
      try { found = Array.from(document.querySelectorAll(s)); } catch (e) { continue; }
      for (const el of found) {
        if (!nodes.some((n) => n.contains(el))) nodes.push(el);
      }
    }
    let boilerChars = 0;
    for (const el of nodes) {
      boilerChars += ((el.innerText || "").replace(/\s+/g, " ").trim()).length;
    }

    // main-content candidate
    const main =
      document.querySelector("main") ||
      document.querySelector("article") ||
      document.querySelector("[role=main]");
    const mainChars = main
      ? ((main.innerText || "").replace(/\s+/g, " ").trim()).length
      : null;

    return {
      title: document.title || "",
      bodyInnerTextChars: bodyText.length,
      boilerplateChars: boilerChars,
      hasMainLandmark: !!main,
      mainChars,
      imgCount: document.images.length,
      linkCount: document.querySelectorAll("a").length,
    };
  }, BOILERPLATE_SELECTORS);
}

async function run() {
  const args = process.argv.slice(2);
  const all = args.includes("--all");
  const siteArg = args.includes("--site") ? args[args.indexOf("--site") + 1] : null;

  const inventory = JSON.parse(fs.readFileSync(INVENTORY, "utf8"));

  // de-duplicate on normalised URL, then pick a spread of sizes per site
  const byNorm = new Map();
  for (const p of inventory) {
    const norm = String(p.url || "").replace(/\/$/, "").toLowerCase();
    if (!byNorm.has(norm)) byNorm.set(norm, p);
  }
  let pages = [...byNorm.values()].filter((p) => p.url);
  if (siteArg) pages = pages.filter((p) => p.url.includes(siteArg));

  if (!all && !siteArg) {
    const bySite = new Map();
    for (const p of pages) {
      const host = new URL(p.url).hostname;
      if (!bySite.has(host)) bySite.set(host, []);
      bySite.get(host).push(p);
    }
    const picked = [];
    for (const [, list] of bySite) {
      list.sort((a, b) => (b.charCount || 0) - (a.charCount || 0));
      picked.push(list[0]);                                  // largest
      if (list.length > 2) picked.push(list[Math.floor(list.length / 2)]); // median
      if (list.length > 1) picked.push(list[list.length - 1]);             // smallest
    }
    pages = picked.filter(Boolean);
  }

  console.log(`replaying ${pages.length} pages through the production extractor\n`);

  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  const results = [];
  for (const [i, p] of pages.entries()) {
    const row = { url: p.url, storedCharCount: p.charCount };
    const t0 = Date.now();
    try {
      await page.goto(p.url, { waitUntil: "networkidle2", timeout: 60000 });
      row.loadMs = Date.now() - t0;

      const dom = await measureDom(page);
      Object.assign(row, dom);

      // ---- production path, exactly as shipped ----
      const html = await page.$eval("body", (body) => body.innerHTML);
      const root = parse(html);
      const text = extractTextAndImageSrc(root).replace(/<img[^>]*>/g, "");
      const chunks = prodChunks(text);

      row.prodChars = text.length;
      row.prodChunks = chunks.length;
      row.images = imageMarkerChars(text);
      row.gluedWords = gluedWordCount(text);
      row.domGluedWords = gluedWordCount(
        await page.evaluate(() => document.body.innerText || "")
      );
      row.midWord = midWordChunkStarts(chunks);
      row.text = text; // kept for cross-page repetition, stripped before writing

      console.log(
        `[${i + 1}/${pages.length}] ${row.prodChars.toString().padStart(7)} chars  ` +
          `${String(row.prodChunks).padStart(3)} chunks  ` +
          `boiler ${((dom.boilerplateChars / Math.max(1, dom.bodyInnerTextChars)) * 100).toFixed(0)}%  ` +
          `${p.url}`
      );
    } catch (e) {
      row.error = String(e.message).slice(0, 160);
      console.log(`[${i + 1}/${pages.length}] ERROR ${row.error}  ${p.url}`);
    }
    results.push(row);
  }

  await browser.close();

  // ---- cross-page repetition, per site ----
  const bySite = new Map();
  for (const r of results) {
    if (!r.text) continue;
    const host = new URL(r.url).hostname;
    if (!bySite.has(host)) bySite.set(host, []);
    bySite.get(host).push(r);
  }
  const repetition = [];
  for (const [host, rows] of bySite) {
    if (rows.length < 2) continue;
    const sets = rows.map((r) => shingles(r.text));
    const counts = new Map();
    for (const s of sets) for (const sh of s) counts.set(sh, (counts.get(sh) || 0) + 1);
    const threshold = Math.ceil(rows.length * 0.6);
    const repeated = new Set([...counts].filter(([, c]) => c >= threshold).map(([s]) => s));
    // share of each page's shingles that are site-wide repeats
    const shares = sets.map((s) => {
      if (!s.size) return 0;
      let hit = 0;
      for (const sh of s) if (repeated.has(sh)) hit++;
      return hit / s.size;
    });
    repetition.push({
      host,
      pages: rows.length,
      repeatedShingles: repeated.size,
      meanRepeatShare: shares.reduce((a, b) => a + b, 0) / shares.length,
    });
  }

  for (const r of results) delete r.text;
  fs.writeFileSync(path.join(OUT, "replay.json"), JSON.stringify({ results, repetition }, null, 2));

  // ---- summary ----
  const ok = results.filter((r) => !r.error);
  const sum = (f) => ok.reduce((a, r) => a + (f(r) || 0), 0);
  console.log("\n" + "=".repeat(70));
  console.log(`pages replayed OK: ${ok.length} / ${results.length}`);
  console.log(
    `boilerplate share of body text: ${(
      (sum((r) => r.boilerplateChars) / Math.max(1, sum((r) => r.bodyInnerTextChars))) *
      100
    ).toFixed(1)}%`
  );
  console.log(
    `pages with a <main>/<article> landmark: ${ok.filter((r) => r.hasMainLandmark).length} / ${ok.length}`
  );
  console.log(
    `image: markers injected: ${sum((r) => r.images?.count)} totalling ${sum(
      (r) => r.images?.chars
    )} chars`
  );
  console.log(
    `glued words  production: ${sum((r) => r.gluedWords)}   real DOM innerText: ${sum(
      (r) => r.domGluedWords
    )}`
  );
  console.log(
    `chunks starting mid-word: ${sum((r) => r.midWord?.bad)} of ${sum((r) => r.midWord?.of)}`
  );
  console.log("\ncross-page repetition (share of each page that is site-wide boilerplate):");
  for (const r of repetition) {
    console.log(
      `  ${r.host.padEnd(30)} ${r.pages} pages  ${(r.meanRepeatShare * 100).toFixed(1)}%`
    );
  }
  console.log("=".repeat(70));
  console.log(`\n-> ${path.join(OUT, "replay.json")}`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
