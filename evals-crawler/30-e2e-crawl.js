/**
 * End-to-end crawl through the shipped code.
 *
 * The loop below is copied from src/app/(secure)/home/fetch-links/api/route.ts
 * as it now stands, and it imports the real helpers from crawl-extract.ts
 * rather than re-implementing them. The only deliberate difference is the
 * browser launch: plain puppeteer instead of @sparticuz/chromium-min, which is
 * an environment difference rather than a logic one.
 *
 * What this checks, per site:
 *   pages found          the path-seed and redirect fixes
 *   duplicates stored    the URL normalisation fix
 *   chunk sanity         no GTM markup, no image URLs, no mid-word cuts
 *   glued words          the extraction fix
 *   elapsed              whether a crawl fits inside the 300s function limit
 *
 *   node evals-crawler/30-e2e-crawl.js
 *   node evals-crawler/30-e2e-crawl.js --site musaffa --limit 10
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const puppeteer = require("puppeteer");

const OUT = path.join(__dirname, "results");
fs.mkdirSync(OUT, { recursive: true });

// compile the real helper so this exercises shipped code, not a copy
const SRC = path.join(__dirname, "..", "src", "app", "_helpers", "server", "crawl-extract.ts");
const TMP = path.join(OUT, "_crawl-extract.js");
execSync(
  `npx esbuild "${SRC}" --bundle --platform=node --format=cjs --external:turndown --external:turndown-plugin-gfm --outfile="${TMP}"`,
  { cwd: path.join(__dirname, ".."), stdio: "pipe" }
);
const { extractPageText, chunkPageText, normalizeUrl, shouldCrawl } = require(TMP);

const imageLinkRegex =
  /^https?:\/\/(?:[\w\-]+\.)+[a-zA-Z]{2,20}(?:\/[^\s?]+)*(?:\.(?:jpg|jpeg|png|gif|bmp|svg|webp|tiff))(?:\?.*)?$/i;

/** extractUrls, as it stands in route.ts */
async function extractUrls(page, baseUrl) {
  const hrefs = await page.$$eval(
    "a",
    (links, baseUrl) =>
      links.map((link) => {
        try {
          let href = link.href;
          if (!href || href === "#" || href.startsWith("javascript:")) return null;
          if (href.startsWith("/")) {
            const protocol = baseUrl.startsWith("https://") ? "https://" : "http://";
            href = protocol + new URL(href, baseUrl).hostname + href;
          }
          if (href.startsWith("//")) href = (baseUrl.startsWith("https://") ? "https:" : "http:") + href;
          const fragment = href.split("/").pop().startsWith("#");
          if (fragment) href = href.split("#")[0];
          else if (href.split("/").pop().includes("#")) return null;
          return href;
        } catch {
          return null;
        }
      }),
    baseUrl
  );
  return hrefs.filter((h) => h !== null);
}

/** the crawl loop from route.ts */
async function crawl(browser, sourceUrl, limit) {
  const t0 = Date.now();
  const page = await browser.newPage();

  let siteHost = new URL(sourceUrl).hostname.replace(/^www\./, "");
  let redirected = null;
  try {
    await page.goto(sourceUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
    const landed = new URL(page.url()).hostname.replace(/^www\./, "");
    if (landed !== siteHost) redirected = page.url();
    siteHost = landed;
  } catch (e) {
    /* keep the seed host */
  }

  const visitedUrls = new Map();
  const pendingUrls = [sourceUrl];
  const crawledData = [];
  const errors = [];

  while (pendingUrls.length > 0) {
    const url = pendingUrls.shift();
    if (!url) continue;
    const key = normalizeUrl(url);
    if (!key || visitedUrls.get(key) === true) continue;
    visitedUrls.set(key, true);

    try {
      await page.goto(url, { waitUntil: "networkidle2", timeout: 180000 });
      if (imageLinkRegex.test(url)) continue;

      const html = await page.$eval("body", (b) => b.innerHTML);
      const text = extractPageText(html);
      const chunks = chunkPageText(text);
      crawledData.push({ crawlLink: url, cleanedText: chunks, charCount: text.length });

      if (crawledData.length === limit) break;

      const newUrls = await extractUrls(page, sourceUrl);
      for (const newUrl of newUrls) {
        const normalized = normalizeUrl(newUrl);
        if (normalized && !visitedUrls.get(normalized) && shouldCrawl(newUrl, siteHost)) {
          pendingUrls.push(normalized);
        }
      }
    } catch (error) {
      errors.push({ url, error: String(error.message).slice(0, 90) });
    }
  }
  await page.close();
  return { crawledData, errors, redirected, siteHost, ms: Date.now() - t0 };
}

// ── the sites that exposed the bugs, plus controls ───────────────────────────
const SITES = [
  { id: "musaffa", url: "https://musaffa.com/index.php", note: "path seed - used to return 1 page", expectMin: 5 },
  { id: "livall", url: "https://mall.livall.com", note: "redirects to apex - used to return 1 page", expectMin: 5 },
  { id: "floatco", url: "https://floatco.com", note: "control - worked before, must not regress", expectMin: 5 },
  { id: "creolestudios", url: "https://www.creolestudios.com", note: "wordpress control", expectMin: 5 },
  { id: "imi-gov-my", url: "https://esd.imi.gov.my/portal/faq/", note: "path seed, gov", expectMin: 3 },
  { id: "yumsing", url: "https://www.yumsinghouse.com", note: "client-rendered control", expectMin: 3 },
];

(async () => {
  const only = process.argv.includes("--site") ? process.argv[process.argv.indexOf("--site") + 1] : null;
  const limit = Number(process.argv[process.argv.indexOf("--limit") + 1]) || 10;
  const sites = SITES.filter((s) => !only || s.id === only);

  const browser = await puppeteer.launch({ headless: "new" });
  const report = [];
  let failures = 0;

  for (const site of sites) {
    const r = await crawl(browser, site.url, limit);
    const pages = r.crawledData;

    // ---- checks against the specific defects ----
    const normalized = pages.map((p) => normalizeUrl(p.crawlLink));
    const duplicates = normalized.length - new Set(normalized).size;
    const allChunks = pages.flatMap((p) => p.cleanedText);
    const gtm = allChunks.filter((c) => c.includes("googletagmanager")).length;
    const imgUrls = allChunks.filter((c) => /https?:\/\/\S+\.(jpg|jpeg|png|gif|webp|svg)/i.test(c)).length;
    const glued = allChunks.reduce((a, c) => a + (c.match(/[a-z][A-Z]/g) || []).length, 0);
    const gluedPer1k = allChunks.length
      ? (glued / allChunks.reduce((a, c) => a + c.length, 0)) * 1000
      : 0;
    let midWord = 0;
    for (const p of pages) {
      for (let i = 1; i < p.cleanedText.length; i++) {
        if (/[A-Za-z]$/.test(p.cleanedText[i - 1]) && /^[a-z]/.test(p.cleanedText[i])) midWord++;
      }
    }
    const emptyChunkPages = pages.filter((p) => p.cleanedText.length === 0).length;

    const checks = [
      { name: `found >= ${site.expectMin} pages`, ok: pages.length >= site.expectMin, got: pages.length },
      { name: "no duplicate pages stored", ok: duplicates === 0, got: duplicates },
      { name: "no GTM markup in chunks", ok: gtm === 0, got: gtm },
      { name: "no image URLs in chunks", ok: imgUrls === 0, got: imgUrls },
      { name: "no mid-word chunk cuts", ok: midWord === 0, got: midWord },
      { name: "every page produced chunks", ok: emptyChunkPages === 0, got: emptyChunkPages },
      { name: "completes within 300s", ok: r.ms < 300000, got: `${(r.ms / 1000).toFixed(1)}s` },
    ];
    const failed = checks.filter((c) => !c.ok);
    failures += failed.length;

    console.log(`\n=== ${site.id} — ${site.note} ===`);
    if (r.redirected) console.log(`  seed redirected to ${r.redirected}, scoped to ${r.siteHost}`);
    console.log(
      `  ${pages.length} pages, ${allChunks.length} chunks, ${r.errors.length} errors, ${(r.ms / 1000).toFixed(1)}s, glued ${gluedPer1k.toFixed(1)}/1k`
    );
    for (const c of checks) console.log(`    ${c.ok ? "PASS" : "FAIL"}  ${c.name.padEnd(28)} ${c.got}`);
    if (pages[0]?.cleanedText[0]) {
      console.log(`  first chunk: ${pages[0].cleanedText[0].replace(/\s+/g, " ").slice(0, 150)}`);
    }

    report.push({ ...site, pages: pages.length, chunks: allChunks.length, errors: r.errors.length, seconds: +(r.ms / 1000).toFixed(1), gluedPer1k: +gluedPer1k.toFixed(1), checks, sample: pages.slice(0, 2) });
    fs.writeFileSync(path.join(OUT, "e2e-crawl.json"), JSON.stringify(report, null, 2));
  }

  await browser.close();
  console.log("\n" + "=".repeat(60));
  console.log(`${sites.length} sites, ${failures} failed checks`);
  console.log("=".repeat(60));
  process.exitCode = failures ? 1 : 0;
})();
