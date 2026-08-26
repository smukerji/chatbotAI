/**
 * Does each shipped fix actually fix the bug it was written for?
 *
 * Every case below is a defect measured earlier in this investigation, restated
 * as a pass/fail check against the helpers now in
 * src/app/_helpers/server/crawl-extract.ts.
 *
 *   node evals-crawler/29-verify-fixes.js
 */

const path = require("path");
const { execSync } = require("child_process");
const fs = require("fs");

// compile the TS helper to a temp CJS module so it can be required directly
const SRC = path.join(__dirname, "..", "src", "app", "_helpers", "server", "crawl-extract.ts");
const TMP = path.join(__dirname, "results", "_crawl-extract.js");

fs.mkdirSync(path.dirname(TMP), { recursive: true });
execSync(
  `npx esbuild "${SRC}" --bundle --platform=node --format=cjs --external:turndown --external:turndown-plugin-gfm --outfile="${TMP}"`,
  { cwd: path.join(__dirname, ".."), stdio: "pipe" }
);

const { extractPageText, chunkPageText, normalizeUrl, shouldCrawl } = require(TMP);

let pass = 0;
let fail = 0;
const check = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : `\n          got  ${JSON.stringify(got)}\n          want ${JSON.stringify(want)}`}`);
  ok ? pass++ : fail++;
};

console.log("\n1. startsWith bug - a path in the seed used to drop every sibling link");
// musaffa: seed https://musaffa.com/index.php returned exactly one page
check("sibling link kept when seed has a path", shouldCrawl("https://musaffa.com/halal-investing.php", "musaffa.com"), true);
check("second sibling kept", shouldCrawl("https://musaffa.com/pricing.php", "musaffa.com"), true);
check("other domain rejected", shouldCrawl("https://example.com/x", "musaffa.com"), false);

console.log("\n2. redirect bug - mall.livall.com forwards to livall.com");
check("link on the landed host kept", shouldCrawl("https://livall.com/products/bh51m", "livall.com"), true);
check("www variant kept", shouldCrawl("https://www.livall.com/products/x", "livall.com"), true);

console.log("\n3. duplicate URLs - 18 pages stored twice, charged to the customer");
check("trailing slash collapses", normalizeUrl("https://floatco.com/") === normalizeUrl("https://floatco.com"), true);
check("path trailing slash collapses", normalizeUrl("https://floatco.com/faq/") === normalizeUrl("https://floatco.com/faq"), true);
check("http and https collapse", normalizeUrl("http://floatco.com/faq") === normalizeUrl("https://floatco.com/faq"), true);
check("www collapses", normalizeUrl("https://www.floatco.com/faq") === normalizeUrl("https://floatco.com/faq"), true);
check("fragment collapses", normalizeUrl("https://floatco.com/faq#top") === normalizeUrl("https://floatco.com/faq"), true);
check("query order collapses", normalizeUrl("https://x.com/a?b=1&a=2") === normalizeUrl("https://x.com/a?a=2&b=1"), true);
check("tracking params stripped", normalizeUrl("https://x.com/a?utm_source=g") === normalizeUrl("https://x.com/a"), true);
check("genuinely different pages stay different", normalizeUrl("https://x.com/a") === normalizeUrl("https://x.com/b"), false);

console.log("\n4. binary and asset links wasted crawl budget");
check("mp4 rejected", shouldCrawl("https://x.com/v.mp4", "x.com"), false);
check("pdf rejected", shouldCrawl("https://x.com/f.pdf", "x.com"), false);
check("css rejected", shouldCrawl("https://x.com/s.css", "x.com"), false);
check("html page kept", shouldCrawl("https://x.com/page", "x.com"), true);

console.log("\n5. NOSCRIPT - every GTM page began with a literal iframe tag");
const gtm = `<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-X"></iframe></noscript><h1>Pricing</h1><p>Our plans.</p>`;
check("googletagmanager markup gone", extractPageText(gtm).includes("googletagmanager"), false);
check("real content kept", extractPageText(gtm).includes("Pricing"), true);

console.log("\n6. image URLs were 18.6% of retrieved context");
const withImg = `<p>Float therapy</p><img src="https://cdn.example.com/very/long/path/photo.jpg"><p>costs $900</p>`;
check("image url gone", extractPageText(withImg).includes("cdn.example.com"), false);
check("surrounding text kept", extractPageText(withImg).includes("$900"), true);

console.log("\n7. glued words - siblings were concatenated with no separator");
const nav = `<ul><li>Float Therapy</li><li>Cold Plunge</li><li>FAQ</li></ul>`;
check("not glued into one token", extractPageText(nav).includes("Float TherapyCold Plunge"), false);

console.log("\n8. chunker hang - lengths that are exact multiples of 1800 never resolved");
for (const len of [1800, 3600, 5400]) {
  const text = ("word ".repeat(Math.ceil(len / 5))).slice(0, len);
  const t0 = Date.now();
  const chunks = chunkPageText(text);
  check(`length ${len} returns in ${Date.now() - t0}ms`, chunks.length > 0, true);
}

console.log("\n9. mid-word chunk cuts - 37.6% of boundaries");
const long = Array.from({ length: 40 }, (_, i) => `## Section ${i}\n\nSome sentence about topic ${i} that runs on for a while so the section has real length to it.`).join("\n\n");
const chunks = chunkPageText(long);
let midWord = 0;
for (let i = 1; i < chunks.length; i++) {
  if (/[A-Za-z]$/.test(chunks[i - 1]) && /^[a-z]/.test(chunks[i])) midWord++;
}
check(`no mid-word boundaries across ${chunks.length} chunks`, midWord, 0);

console.log("\n10. real tables survive as markdown tables");
const table = `<table><thead><tr><th>Plan</th><th>Price</th></tr></thead><tbody><tr><td>Basic</td><td>$500</td></tr><tr><td>Pro</td><td>$900</td></tr></tbody></table>`;
const md = extractPageText(table);
check("emitted as a markdown table", /\|\s*Plan\s*\|/.test(md), true);
check("price stays with its plan", /Pro\s*\|\s*\$900/.test(md), true);

console.log("\n" + "=".repeat(52));
console.log(`${pass} passed, ${fail} failed`);
console.log("=".repeat(52));
process.exitCode = fail ? 1 : 0;

console.log("\n11. oversized chunks - a block with no headings or blank lines used to survive whole");
const unbroken = "word ".repeat(2000); // 10,000 chars, no structure at all
const oversizeChunks = chunkPageText(unbroken);
check(`all chunks within 2000 chars (${oversizeChunks.length} chunks)`, oversizeChunks.every((c) => c.length <= 2000), true);
const sentences = Array.from({ length: 200 }, (_, i) => `This is sentence number ${i} on the page.`).join(" ");
const sentenceChunks = chunkPageText(sentences);
check("sentence text also bounded", sentenceChunks.every((c) => c.length <= 2000), true);
check("no sentence chunk is empty", sentenceChunks.every((c) => c.trim().length > 0), true);

console.log("\n" + "=".repeat(52));
console.log(`${pass} passed, ${fail} failed`);
console.log("=".repeat(52));
process.exitCode = fail ? 1 : 0;
