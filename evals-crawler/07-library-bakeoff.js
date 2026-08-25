/**
 * Same page, three extraction paths, side by side:
 *
 *   A. production  - extractTextAndImageSrc + 2000/1800 windows (as shipped)
 *   B. turndown    - HTML -> Markdown, tables preserved
 *   C. readability - main-content selection, then turndown
 *
 * Readability runs inside the puppeteer page rather than under jsdom, so it sees
 * the same rendered DOM the crawler does. Turndown runs in node on the HTML that
 * survives.
 *
 *   node evals-crawler/07-library-bakeoff.js https://floatco.com/pricing
 */

const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const { parse } = require("node-html-parser");
const TurndownService = require("turndown");
const { gfm } = require("turndown-plugin-gfm");

const OUT = path.join(__dirname, "results");
const READABILITY_SRC = require.resolve("@mozilla/readability/Readability.js");

// ── VERBATIM production path, route.ts L214-243 + L339-352 ───────────────────
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
    element.childNodes.forEach((c) => (text += extractTextAndImageSrc(c)));
    return text.replace(/(\r\n|\n|\r|\t|)/gm, "").trim();
  }
}

function windowChunks(text) {
  const out = [];
  let start = 0;
  while (start < text.length) {
    out.push(text.substring(start, start + 2000));
    start += 1800;
  }
  return out;
}

// ── markdown-aware chunking: split on headings, then bound by size ───────────
function markdownChunks(md, max = 2000) {
  const sections = md.split(/\n(?=#{1,6}\s)/);
  const out = [];
  for (const s of sections) {
    if (s.length <= max) {
      if (s.trim()) out.push(s.trim());
      continue;
    }
    // oversized section: split on blank lines, never mid-word
    let buf = "";
    for (const para of s.split(/\n{2,}/)) {
      if ((buf + "\n\n" + para).length > max && buf) {
        out.push(buf.trim());
        buf = para;
      } else {
        buf = buf ? buf + "\n\n" + para : para;
      }
    }
    if (buf.trim()) out.push(buf.trim());
  }
  return out;
}

function makeTurndown() {
  const td = new TurndownService({ headingStyle: "atx", codeBlockStyle: "fenced" });
  td.use(gfm); // tables, strikethrough
  td.remove(["script", "style", "noscript", "iframe", "svg"]);
  // images carry no text value for retrieval; drop them entirely
  td.addRule("dropImages", { filter: "img", replacement: () => "" });
  return td;
}

function stats(label, text, chunks) {
  const glued = (text.match(/[a-z][A-Z]/g) || []).length;
  let midWord = 0;
  for (let i = 1; i < chunks.length; i++) {
    if (/[A-Za-z]/.test(chunks[i - 1].slice(-1)) && /[a-z]/.test(chunks[i][0])) midWord++;
  }
  const imageChars = (text.match(/image:\s*https?:\/\/\S+/g) || []).reduce((a, s) => a + s.length, 0);
  const hasTable = /\|.*\|/.test(text);
  return { label, chars: text.length, chunks: chunks.length, glued, midWord, imageChars, hasTable };
}

(async () => {
  const url = process.argv[2] || "https://floatco.com/pricing";
  fs.mkdirSync(OUT, { recursive: true });

  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

  const bodyHtml = await page.$eval("body", (b) => b.innerHTML);
  const fullHtml = await page.content();

  // C: Readability in-page, against the rendered DOM
  await page.addScriptTag({ path: READABILITY_SRC });
  const article = await page.evaluate(() => {
    const clone = document.cloneNode(true);
    // eslint-disable-next-line no-undef
    const r = new Readability(clone).parse();
    return r ? { title: r.title, content: r.content, textLength: r.length } : null;
  });

  await browser.close();

  const td = makeTurndown();

  // A - production
  const prodText = extractTextAndImageSrc(parse(bodyHtml)).replace(/<img[^>]*>/g, "");
  const prodChunks = windowChunks(prodText);

  // B - turndown on the whole body
  const tdMd = td.turndown(bodyHtml);
  const tdChunks = markdownChunks(tdMd);

  // C - readability then turndown
  const readMd = article ? td.turndown(article.content) : "";
  const readChunks = article ? markdownChunks(readMd) : [];

  const rows = [
    stats("A production", prodText, prodChunks),
    stats("B turndown", tdMd, tdChunks),
    stats("C readability+turndown", readMd, readChunks),
  ];

  console.log(`\n${url}\n`);
  console.log(
    "path".padEnd(24) + "chars".padStart(8) + "chunks".padStart(8) +
    "glued".padStart(8) + "midWord".padStart(9) + "imgChars".padStart(10) + "  table?"
  );
  console.log("-".repeat(74));
  for (const r of rows) {
    console.log(
      r.label.padEnd(24) + String(r.chars).padStart(8) + String(r.chunks).padStart(8) +
      String(r.glued).padStart(8) + String(r.midWord).padStart(9) +
      String(r.imageChars).padStart(10) + "  " + (r.hasTable ? "yes" : "no")
    );
  }

  // show the pricing region from each path
  const findPricing = (s) => {
    const i = s.search(/\$\s?500|\$500/);
    return i === -1 ? "(no $500 found)" : s.slice(Math.max(0, i - 400), i + 500);
  };

  console.log("\n" + "=".repeat(74));
  console.log("PRODUCTION, around the pricing figures");
  console.log("=".repeat(74));
  console.log(findPricing(prodText));

  console.log("\n" + "=".repeat(74));
  console.log("TURNDOWN, same region");
  console.log("=".repeat(74));
  console.log(findPricing(tdMd));

  fs.writeFileSync(path.join(OUT, "bakeoff-production.txt"), prodText);
  fs.writeFileSync(path.join(OUT, "bakeoff-turndown.md"), tdMd);
  fs.writeFileSync(path.join(OUT, "bakeoff-readability.md"), readMd);
  fs.writeFileSync(path.join(OUT, "bakeoff-stats.json"), JSON.stringify({ url, rows }, null, 2));
  console.log(`\n-> ${OUT}\\bakeoff-*.{txt,md,json}`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
