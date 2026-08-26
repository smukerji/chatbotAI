/**
 * tinhte loads fine under Puppeteer (4.2s, 7785 chars) yet Crawlee fetched
 * zero pages. Crawlee drives Playwright, so isolate which layer refuses:
 * raw Playwright, then Crawlee's PlaywrightCrawler on the same URL.
 *
 *   node evals-crawler/14-tinhte-isolate.js
 */

const fs = require("fs");
const path = require("path");

const OUT = path.join(__dirname, "results", "tinhte-isolate.txt");
fs.writeFileSync(OUT, "");
const log = (m) => {
  fs.appendFileSync(OUT, m + "\n");
  console.log(m);
};

const URL = "https://tinhte.vn";

async function rawPlaywright() {
  const { chromium } = require("playwright");
  const t0 = Date.now();
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 45000 });
    const chars = await page.evaluate(() => (document.body.innerText || "").length);
    log(`raw playwright   OK  ${chars} chars  ${((Date.now() - t0) / 1000).toFixed(1)}s  -> ${page.url()}`);
  } catch (e) {
    log(`raw playwright   FAILED after ${((Date.now() - t0) / 1000).toFixed(1)}s: ${String(e.message).slice(0, 160)}`);
  } finally {
    await browser.close();
  }
}

async function viaCrawlee() {
  const { PlaywrightCrawler, Configuration } = require("crawlee");
  const t0 = Date.now();
  let ok = 0;
  const failures = [];

  const crawler = new PlaywrightCrawler(
    {
      maxRequestsPerCrawl: 1,
      maxRequestRetries: 0,
      navigationTimeoutSecs: 45,
      requestHandlerTimeoutSecs: 90,
      headless: true,
      async requestHandler({ page, request }) {
        const chars = await page.evaluate(() => (document.body.innerText || "").length);
        ok++;
        log(`crawlee          OK  ${chars} chars  -> ${request.loadedUrl}`);
      },
      failedRequestHandler({ request }, error) {
        // this is the message the earlier run discarded
        failures.push(String(error?.message || error).slice(0, 300));
      },
    },
    new Configuration({ persistStorage: false })
  );

  await crawler.run([URL]);
  if (!ok) {
    log(`crawlee          FAILED after ${((Date.now() - t0) / 1000).toFixed(1)}s`);
    for (const f of failures) log(`    reason: ${f}`);
    if (!failures.length) log("    (no failure message captured)");
  }
}

(async () => {
  log(`isolating ${URL}\n`);
  await rawPlaywright();
  await viaCrawlee();
  log(`\n-> ${OUT}`);
})();
