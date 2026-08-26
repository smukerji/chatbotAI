/**
 * Why did Crawlee fail on tinhte and duplicate content on nextjs?
 * Measures rather than guesses. Writes to results/diagnose.txt.
 *
 *   node evals-crawler/13-diagnose.js
 */

const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");

const OUT = path.join(__dirname, "results", "diagnose.txt");
fs.writeFileSync(OUT, "");
const log = (m) => {
  fs.appendFileSync(OUT, m + "\n");
  console.log(m);
};

const CASES = [
  { id: "tinhte", url: "https://tinhte.vn", note: "crawlee got 0 pages" },
  { id: "nextjs-a", url: "https://nextjs.org/docs", note: "10 urls -> 5 distinct" },
  { id: "nextjs-b", url: "https://nextjs.org/blog", note: "should differ from /docs" },
  { id: "nextjs-c", url: "https://nextjs.org/showcase", note: "should differ from /docs" },
];

async function probe(browser, c) {
  const page = await browser.newPage();
  const row = { id: c.id, url: c.url };
  const t0 = Date.now();
  try {
    await page.goto(c.url, { waitUntil: "domcontentloaded", timeout: 45000 });
    row.dclMs = Date.now() - t0;
    row.landedOn = page.url();
    row.charsAtDcl = await page.evaluate(() => (document.body.innerText || "").length);

    // how much more appears if we wait?
    await page.waitForTimeout(2500);
    row.charsAfter2500 = await page.evaluate(() => (document.body.innerText || "").length);
    row.head = (await page.evaluate(() => (document.body.innerText || "").trim().slice(0, 120))).replace(/\s+/g, " ");

    // would networkidle ever settle here?
    const t1 = Date.now();
    try {
      await page.waitForLoadState
        ? null
        : null;
      await page.goto(c.url, { waitUntil: "networkidle2", timeout: 30000 });
      row.networkidle2Ms = Date.now() - t1;
    } catch (e) {
      row.networkidle2Ms = "TIMEOUT >30s";
    }
  } catch (e) {
    row.error = String(e.message).slice(0, 140);
    row.failedAfterMs = Date.now() - t0;
  }
  await page.close();
  return row;
}

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const rows = [];
  for (const c of CASES) {
    const r = await probe(browser, c);
    rows.push(r);
    log(`=== ${c.id}  (${c.note})`);
    if (r.error) {
      log(`    ERROR after ${r.failedAfterMs}ms: ${r.error}`);
    } else {
      log(`    landed        ${r.landedOn}`);
      log(`    domcontentloaded in ${r.dclMs}ms`);
      log(`    chars at DCL      ${r.charsAtDcl}`);
      log(`    chars after 2.5s  ${r.charsAfter2500}   (${r.charsAfter2500 - r.charsAtDcl} more)`);
      log(`    networkidle2      ${r.networkidle2Ms}`);
      log(`    head: ${r.head}`);
    }
    log("");
  }

  // do the three nextjs pages actually differ?
  const nx = rows.filter((r) => r.id.startsWith("nextjs") && r.head);
  if (nx.length > 1) {
    log("nextjs first-120-chars comparison:");
    for (const r of nx) log(`  ${r.id.padEnd(10)} ${r.head.slice(0, 90)}`);
    const uniq = new Set(nx.map((r) => r.head)).size;
    log(`  distinct openings: ${uniq} of ${nx.length}`);
  }

  await browser.close();
  fs.appendFileSync(OUT, "\n" + JSON.stringify(rows, null, 2));
  log(`\n-> ${OUT}`);
})();
