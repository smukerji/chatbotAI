/**
 * Does the crawl output still satisfy what the rest of the pipeline expects?
 *
 * The extraction change altered how chunks are produced, so the shape of what
 * the route returns has to keep matching its consumers:
 *
 *   store.js / store-v2.js   obj.cleanedText?.forEach((element) => ...)
 *                            each element becomes one Pinecone vector, so it
 *                            must be a non-empty string
 *                            obj.charCount is stored as-is
 *   Website.tsx              parseInt(item.charCount) for the billing counter
 *
 * A shape mismatch here would not throw - it would silently store nothing, or
 * store objects instead of text. That is the failure worth catching before a
 * deploy rather than after.
 *
 *   node evals-crawler/31-downstream-contract.js
 */

const fs = require("fs");
const path = require("path");

const OUT = path.join(__dirname, "results");
const CRAWL = path.join(OUT, "e2e-crawl.json");

if (!fs.existsSync(CRAWL)) {
  console.error("run 30-e2e-crawl.js first");
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(CRAWL, "utf8"));

let pass = 0;
let fail = 0;
const check = (name, ok, detail = "") => {
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  ${detail}` : ""}`);
  ok ? pass++ : fail++;
};

console.log("crawl output vs downstream expectations\n");

for (const site of report) {
  const pages = site.sample || [];
  if (!pages.length) {
    console.log(`${site.id}: no sample stored, skipping`);
    continue;
  }
  console.log(`${site.id}`);

  for (const p of pages) {
    // store.js: obj.cleanedText?.forEach((element) => tempData.push({ element, ... }))
    check(
      "cleanedText is an array",
      Array.isArray(p.cleanedText),
      `${typeof p.cleanedText}`
    );
    check(
      "every chunk is a non-empty string",
      p.cleanedText.every((c) => typeof c === "string" && c.trim().length > 0),
      `${p.cleanedText.length} chunks`
    );
    // Website.tsx: parseInt(item.charCount)
    check(
      "charCount survives parseInt",
      Number.isFinite(parseInt(p.charCount, 10)) && parseInt(p.charCount, 10) >= 0,
      `${p.charCount}`
    );
    check("crawlLink is a string", typeof p.crawlLink === "string" && p.crawlLink.length > 0);

    // a chunk that exceeds the embedding input budget would be truncated silently
    const oversize = p.cleanedText.filter((c) => c.length > 8000).length;
    check("no chunk exceeds 8000 chars", oversize === 0, `${oversize} oversize`);

    // store-v2 skips pages with zero chunks, but charCount is still billed;
    // a page with content must not produce an empty chunk list
    check(
      "page with content produced chunks",
      !(p.charCount > 200 && p.cleanedText.length === 0),
      `charCount ${p.charCount}, chunks ${p.cleanedText.length}`
    );
    break; // one page per site is enough to prove the shape
  }
}

console.log("\n" + "=".repeat(52));
console.log(`${pass} passed, ${fail} failed`);
console.log("=".repeat(52));
process.exitCode = fail ? 1 : 0;
