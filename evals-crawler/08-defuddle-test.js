/**
 * Does Defuddle keep the pricing that Readability threw away?
 *
 * Readability scored 0 occurrences of "$500" on floatco.com/pricing - it decided
 * the pricing grid was not the article. Defuddle exists specifically to fix that
 * over-stripping, so this checks the claim on the page that exposed it.
 *
 *   node evals-crawler/08-defuddle-test.js [url]
 */

const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const TurndownService = require("turndown");
const { gfm } = require("turndown-plugin-gfm");

const OUT = path.join(__dirname, "results");

// probes: facts a support bot must be able to answer from this page
const PROBES = ["$500", "$900", "$1,600", "$800", "1 float per month", "COLD plunge"];

function makeTurndown() {
  const td = new TurndownService({ headingStyle: "atx" });
  td.use(gfm);
  td.remove(["script", "style", "noscript", "iframe", "svg"]);
  td.addRule("dropImages", { filter: "img", replacement: () => "" });
  return td;
}

function score(label, text) {
  const kept = PROBES.filter((p) => text.includes(p));
  return {
    label,
    chars: text.length,
    probesKept: `${kept.length}/${PROBES.length}`,
    missing: PROBES.filter((p) => !text.includes(p)),
    glued: (text.match(/[a-z][A-Z]/g) || []).length,
    imageChars: (text.match(/image:\s*https?:\/\/\S+/g) || []).reduce((a, s) => a + s.length, 0),
  };
}

(async () => {
  const url = process.argv[2] || "https://floatco.com/pricing";
  fs.mkdirSync(OUT, { recursive: true });

  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
  const html = await page.content();
  await browser.close();

  const td = makeTurndown();
  const rows = [];

  // Defuddle - ESM only, so dynamic import
  const { Defuddle } = await import("defuddle/node");
  const { JSDOM } = require("jsdom");
  const dom = new JSDOM(html, { url });
  const result = await Defuddle(dom, url, { markdown: true });
  const defuddleOut = result.content || "";
  rows.push(score("defuddle", defuddleOut));
  fs.writeFileSync(path.join(OUT, "bakeoff-defuddle.md"), defuddleOut);

  // compare against what we already produced
  for (const [label, file] of [
    ["production", "bakeoff-production.txt"],
    ["turndown", "bakeoff-turndown.md"],
    ["readability", "bakeoff-readability.md"],
  ]) {
    const p = path.join(OUT, file);
    if (fs.existsSync(p)) rows.push(score(label, fs.readFileSync(p, "utf8")));
  }

  console.log(`\n${url}\n`);
  console.log("extractor".padEnd(14) + "chars".padStart(8) + "probes".padStart(9) + "glued".padStart(8) + "imgChars".padStart(10));
  console.log("-".repeat(50));
  for (const r of rows) {
    console.log(
      r.label.padEnd(14) + String(r.chars).padStart(8) + String(r.probesKept).padStart(9) +
      String(r.glued).padStart(8) + String(r.imageChars).padStart(10)
    );
  }
  console.log("\nmissing probes:");
  for (const r of rows) {
    console.log(`  ${r.label.padEnd(14)} ${r.missing.length ? r.missing.join(", ") : "none"}`);
  }

  const i = defuddleOut.search(/\$500/);
  console.log("\n--- defuddle output around the pricing ---");
  console.log(i === -1 ? "($500 NOT FOUND)" : defuddleOut.slice(Math.max(0, i - 350), i + 400));

  fs.writeFileSync(path.join(OUT, "probe-scores.json"), JSON.stringify({ url, rows }, null, 2));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
