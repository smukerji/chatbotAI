/**
 * Per-page forensics. Two jobs:
 *
 *   1. Measure boilerplate correctly. 02-replay double-counted because nested
 *      matches of overlapping selectors were both added. Here we clone the body,
 *      remove boilerplate nodes, and diff innerText length. One number, no overlap.
 *   2. Dump what the production extractor actually produced, so claims about
 *      "noise" are backed by the real text rather than inferred from a percentage.
 *
 *   node evals-crawler/03-inspect.js <url> [<url> ...]
 */

const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const { parse } = require("node-html-parser");

const OUT = path.join(__dirname, "results");

// VERBATIM from route.ts L214-243
const imageLinkRegex =
  /^https?:\/\/(?:[\w\-]+\.)+[a-zA-Z]{2,20}(?:\/[^\s?]+)*(?:\.(?:jpg|jpeg|png|gif|bmp|svg|webp|tiff))(?:\?.*)?$/i;

function extractTextAndImageSrc(element) {
  if (element.tagName === "SCRIPT" || element.tagName === "SVG" || element.tagName === "STYLE") {
    return "";
  } else if (element.tagName === "IMG") {
    const imgSrc = element.getAttribute("src");
    if (imageLinkRegex.test(imgSrc)) return `      image: ${decodeURI(imgSrc)}          `;
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

const BOILER = [
  "nav", "header", "footer", "aside", "noscript", "iframe",
  "[role=navigation]", "[role=banner]", "[role=contentinfo]",
];

async function inspect(page, url) {
  await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

  const dom = await page.evaluate((sels) => {
    const norm = (s) => (s || "").replace(/\s+/g, " ").trim();
    const full = norm(document.body.innerText).length;

    // clone, strip boilerplate, re-measure. no double counting.
    const clone = document.body.cloneNode(true);
    document.body.appendChild(clone);
    clone.style.position = "absolute";
    clone.style.left = "-99999px";
    for (const s of sels) {
      let found = [];
      try { found = Array.from(clone.querySelectorAll(s)); } catch (e) { continue; }
      for (const el of found) el.remove();
    }
    const stripped = norm(clone.innerText).length;
    clone.remove();

    const main =
      document.querySelector("main") || document.querySelector("article") || document.querySelector("[role=main]");

    return {
      title: document.title || "",
      bodyChars: full,
      afterBoilerplateStripChars: stripped,
      boilerplateChars: Math.max(0, full - stripped),
      mainChars: main ? norm(main.innerText).length : null,
      imgCount: document.images.length,
      linkCount: document.querySelectorAll("a").length,
      h1: norm(document.querySelector("h1")?.innerText || "").slice(0, 120),
    };
  }, BOILER);

  const html = await page.$eval("body", (b) => b.innerHTML);
  const root = parse(html);
  const text = extractTextAndImageSrc(root).replace(/<img[^>]*>/g, "");
  const chunks = prodChunks(text);
  const domInnerText = await page.evaluate(() => (document.body.innerText || "").replace(/\s+/g, " ").trim());

  return {
    url,
    ...dom,
    boilerplatePct: dom.bodyChars ? (dom.boilerplateChars / dom.bodyChars) * 100 : 0,
    prodChars: text.length,
    domInnerTextChars: domInnerText.length,
    prodChunks: chunks.length,
    glued: (text.match(/[a-z][A-Z]/g) || []).length,
    domGlued: (domInnerText.match(/[a-z][A-Z]/g) || []).length,
    sampleHead: text.slice(0, 900),
    sampleMiddle: chunks[Math.floor(chunks.length / 2)]?.slice(0, 900) || "",
    sampleTail: text.slice(-500),
  };
}

(async () => {
  const urls = process.argv.slice(2);
  if (!urls.length) {
    console.error("usage: node 03-inspect.js <url> [<url> ...]");
    process.exit(1);
  }
  fs.mkdirSync(OUT, { recursive: true });

  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  const rows = [];
  for (const url of urls) {
    try {
      const r = await inspect(page, url);
      rows.push(r);
      console.log("\n" + "=".repeat(78));
      console.log(url);
      console.log("=".repeat(78));
      console.log(`title             ${r.title}`);
      console.log(`h1                ${r.h1}`);
      console.log(`body innerText    ${r.bodyChars} chars`);
      console.log(`boilerplate       ${r.boilerplateChars} chars  (${r.boilerplatePct.toFixed(1)}%)`);
      console.log(`<main> content    ${r.mainChars === null ? "no landmark" : r.mainChars + " chars"}`);
      console.log(`production text   ${r.prodChars} chars  -> ${r.prodChunks} chunks`);
      console.log(`links / images    ${r.linkCount} / ${r.imgCount}`);
      console.log(`glued words       prod ${r.glued}   dom ${r.domGlued}`);
      console.log(`\n--- production text, first 900 chars ---\n${r.sampleHead}`);
      console.log(`\n--- middle chunk, first 900 chars ---\n${r.sampleMiddle}`);
    } catch (e) {
      console.log(`\nERROR ${url}: ${e.message}`);
      rows.push({ url, error: e.message });
    }
  }

  await browser.close();
  fs.writeFileSync(path.join(OUT, "inspect.json"), JSON.stringify(rows, null, 2));
  console.log(`\n-> ${path.join(OUT, "inspect.json")}`);
})();
