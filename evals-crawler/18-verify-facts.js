/**
 * Every `must` fact in 17-stage4.js is an assertion about a live page. This
 * fetches each site and checks the string is actually present, so no probe
 * demands a fact the page does not contain. A probe that fails here would make
 * every variant look broken for a reason unrelated to the variant.
 *
 *   node evals-crawler/18-verify-facts.js
 */

const path = require("path");
const puppeteer = require("puppeteer");

const CHECKS = [
  { site: "floatco", url: "https://floatco.com/pricing", facts: ["$900", "$500", "$1,600", "$800", "$450"] },
  { site: "floatco", url: "https://floatco.com/", facts: ["Caine"] },
  {
    site: "gov-uk",
    url: "https://www.gov.uk/income-tax-rates",
    facts: ["12,570", "20%", "40%", "45%", "100,000"],
  },
  {
    site: "w3schools",
    url: "https://www.w3schools.com/html/html_tables.asp",
    facts: ["<table>", "<tr>", "<th>"],
  },
];

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  let bad = 0;

  for (const c of CHECKS) {
    let text = "";
    try {
      await page.goto(c.url, { waitUntil: "domcontentloaded", timeout: 45000 });
      await page.waitForTimeout(1200);
      text = await page.evaluate(() => document.body.innerText || "");
    } catch (e) {
      console.log(`FETCH FAILED ${c.url}: ${String(e.message).slice(0, 80)}`);
      bad += c.facts.length;
      continue;
    }
    const squashed = text.replace(/\s+/g, "");
    console.log(`\n${c.site}  ${c.url}  (${text.length} chars)`);
    for (const f of c.facts) {
      const present = squashed.includes(f.replace(/\s+/g, ""));
      if (!present) bad++;
      console.log(`  ${present ? "FOUND   " : "MISSING "} ${f}`);
    }
  }

  await browser.close();
  console.log("\n" + "=".repeat(50));
  console.log(bad === 0 ? "all asserted facts verified on the live pages" : `${bad} asserted facts NOT on the page - remove them`);
  console.log("=".repeat(50));
  process.exitCode = bad ? 1 : 0;
})();
