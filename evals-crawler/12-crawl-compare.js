/**
 * Stage 1 - crawl quality. Current implementation vs Crawlee, same seeds,
 * same page budget, same machine.
 *
 * The current crawler is reproduced here from
 * src/app/(secure)/home/fetch-links/api/route.ts - the BFS loop, the
 * extractUrls link filter and the visitedUrls Map - so the comparison is
 * against shipped behaviour rather than an idealised version of it.
 *
 * Nothing is embedded and nothing is written anywhere. Read-only.
 *
 *   node evals-crawler/12-crawl-compare.js
 *   node evals-crawler/12-crawl-compare.js --site floatco --budget 12
 */

const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");

const OUT = path.join(__dirname, "results");
const BUDGET = Number(process.argv[process.argv.indexOf("--budget") + 1]) || 12;
const SITE_FILTER = process.argv.includes("--site")
  ? process.argv[process.argv.indexOf("--site") + 1]
  : null;

// Seeds cover the failure modes found earlier plus the two conditions that
// break the shipped link filter: a seed containing a path, and a seed that
// redirects to a different host.
const SEEDS = [
  { id: "floatco", url: "https://floatco.com", note: "webflow, css-grid pricing" },
  { id: "musaffa", url: "https://musaffa.com/index.php", note: "SPA + path seed" },
  { id: "livall", url: "https://mall.livall.com", note: "shopify, redirects to apex" },
  { id: "yumsing", url: "https://www.yumsinghouse.com", note: "client-rendered, www seed" },
  { id: "creolestudios", url: "https://www.creolestudios.com", note: "wordpress" },
  { id: "spica", url: "https://marketplace.spica.com", note: "marketplace listing" },
  { id: "imi-gov-my", url: "https://esd.imi.gov.my/portal/faq/", note: "gov, path seed" },
  { id: "tinhte", url: "https://tinhte.vn", note: "vietnamese, ad-heavy" },
  { id: "w3schools", url: "https://www.w3schools.com/html/", note: "static, path seed" },
  { id: "nextjs", url: "https://nextjs.org/docs", note: "hybrid docs, path seed" },
  { id: "gov-uk", url: "https://www.gov.uk/income-tax-rates", note: "gov, deep path seed" },
  { id: "python-docs", url: "https://docs.python.org/3/library/", note: "sphinx, path seed" },
];

/**
 * Scope by the host the seed actually LANDS on, www stripped.
 *
 * An earlier version compared registrable domains to survive the
 * mall.livall.com -> livall.com redirect, but that was too loose: on
 * w3schools it admitted profile., order. and campus. subdomains, so the crawl
 * spent its budget on login and pricing pages. Resolving the redirect first
 * makes exact host matching sufficient for both cases.
 */
function siteHost(hostname) {
  return hostname.toLowerCase().replace(/^www\./, "");
}

/** Follow redirects once so the crawl scope is based on where the seed lands. */
async function resolveSeed(url) {
  const browser = await puppeteer.launch({ headless: "new" });
  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    return page.url();
  } catch {
    return url;
  } finally {
    await browser.close();
  }
}

// ── current implementation, ported from route.ts ─────────────────────────────

async function crawlCurrent(seed, budget) {
  const t0 = Date.now();
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  const visitedUrls = new Map();
  const pendingUrls = [seed];
  const pages = [];
  const errors = [];

  while (pendingUrls.length > 0 && pages.length < budget) {
    const url = pendingUrls.shift();
    if (!url || visitedUrls.get(url) == true || url.endsWith(".mp4")) continue;
    visitedUrls.set(url, true);

    try {
      await page.goto(url, { waitUntil: "networkidle2", timeout: 45000 });
      const html = await page.$eval("body", (b) => b.innerHTML);
      const text = await page.evaluate(() => document.body.innerText || "");
      pages.push({ url, htmlLen: html.length, textLen: text.length, text });

      // extractUrls, as shipped: startsWith(baseUrl) filter
      const hrefs = await page.$$eval(
        "a",
        (links, baseUrl) =>
          links
            .map((l) => {
              try {
                let href = l.href;
                if (!href || href === "#" || href.startsWith("javascript:")) return null;
                if (href.split("/").pop().startsWith("#")) href = href.split("#")[0];
                else if (href.split("/").pop().includes("#")) return null;
                const u = new URL(href);
                const b = new URL(baseUrl);
                if (b.hostname.startsWith("www.")) {
                  if (!u.hostname.startsWith("www.")) u.hostname = "www." + u.hostname;
                } else u.hostname = u.hostname.replace(/^www\./, "");
                return u.href;
              } catch {
                return null;
              }
            })
            .filter(Boolean),
        seed
      );
      for (const h of hrefs) {
        if (h.startsWith(seed) && !visitedUrls.get(h)) pendingUrls.push(h);
      }
    } catch (e) {
      errors.push({ url, error: String(e.message).slice(0, 80) });
    }
  }

  await browser.close();
  return { pages, errors, ms: Date.now() - t0, fetched: visitedUrls.size };
}

// ── Crawlee ──────────────────────────────────────────────────────────────────

async function crawlWithCrawlee(seed, budget, resolvedSeed) {
  const { PlaywrightCrawler, Configuration } = require("crawlee");
  const t0 = Date.now();
  const pages = [];
  const errors = [];
  // scope on where the seed actually lands, not where it was typed
  const seedDomain = siteHost(new URL(resolvedSeed || seed).hostname);

  const config = new Configuration({ persistStorage: false });

  const crawler = new PlaywrightCrawler(
    {
      maxRequestsPerCrawl: budget,
      maxRequestRetries: 1,
      navigationTimeoutSecs: 45,
      requestHandlerTimeoutSecs: 90,
      headless: true,
      // PlaywrightCrawler defaults to waitUntil 'load', which waits on every ad
      // iframe. Measured: tinhte.vn loads in 8.8s under raw Playwright with
      // domcontentloaded, but Crawlee timed out at 45s and fetched zero pages.
      preNavigationHooks: [
        async (_ctx, gotoOptions) => {
          gotoOptions.waitUntil = "domcontentloaded";
        },
      ],
      async requestHandler({ page, request, enqueueLinks }) {
        // client-rendered pages need a settle window; static ones do not.
        // Wait for the text to stop growing rather than guessing a duration.
        let prev = -1;
        for (let i = 0; i < 6; i++) {
          const n = await page.evaluate(() => (document.body.innerText || "").length);
          if (n === prev && n > 0) break;
          prev = n;
          await page.waitForTimeout(400);
        }
        const html = await page.evaluate(() => document.body.innerHTML);
        const text = await page.evaluate(() => document.body.innerText || "");
        pages.push({ url: request.loadedUrl || request.url, htmlLen: html.length, textLen: text.length, text });

        await enqueueLinks({
          // "all", not "same-domain" - the domain check below is by registrable
          // domain so a redirect to another subdomain does not empty the queue
          strategy: "all",
          transformRequestFunction(req) {
            // close the three gaps measured in 11-crawlee-dedup.js:
            // www vs bare, http vs https, and trailing slash
            try {
              const u = new URL(req.url);
              u.protocol = "https:";
              u.hostname = u.hostname.replace(/^www\./, "");
              u.hash = "";
              if (u.pathname !== "/" && u.pathname.endsWith("/")) u.pathname = u.pathname.slice(0, -1);
              if (siteHost(u.hostname) !== seedDomain) return false;
              if (/\.(mp4|jpg|jpeg|png|gif|svg|webp|pdf|zip|css|js)$/i.test(u.pathname)) return false;
              req.url = u.href;
              return req;
            } catch {
              return false;
            }
          },
        });
      },
      failedRequestHandler({ request }, error) {
        errors.push({ url: request.url, error: String(error?.message).slice(0, 80) });
      },
    },
    config
  );

  await crawler.run([seed]);
  return { pages, errors, ms: Date.now() - t0, fetched: pages.length + errors.length };
}

// ── comparison metrics ───────────────────────────────────────────────────────

/**
 * How many of the fetched pages are actually distinct content?
 *
 * An earlier version hashed only the first 3000 characters, which reported
 * nextjs.org as 5 distinct pages out of 10 when a direct check showed all of
 * them differ - on a docs site the opening 3000 characters are shared sidebar.
 * Hash the whole normalised text instead.
 */
function distinctContent(pages) {
  const crypto = require("crypto");
  const seen = new Set();
  for (const p of pages) {
    const norm = (p.text || "").replace(/\s+/g, " ").trim();
    seen.add(crypto.createHash("sha1").update(norm).digest("hex"));
  }
  return seen.size;
}

function normUrl(u) {
  try {
    const x = new URL(u);
    x.protocol = "https:";
    x.hostname = x.hostname.replace(/^www\./, "");
    x.hash = "";
    if (x.pathname !== "/" && x.pathname.endsWith("/")) x.pathname = x.pathname.slice(0, -1);
    return x.href;
  } catch {
    return u;
  }
}

function distinctUrls(pages) {
  return new Set(pages.map((p) => normUrl(p.url))).size;
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const seeds = SEEDS.filter((s) => !SITE_FILTER || s.id === SITE_FILTER);
  const rows = [];

  for (const seed of seeds) {
    console.log(`\n=== ${seed.id}  (${seed.note})  budget ${BUDGET} pages ===`);

    const resolved = await resolveSeed(seed.url);
    if (resolved !== seed.url) console.log(`  seed redirects -> ${resolved}`);

    let cur, cra;
    try {
      // deliberately unchanged: this is the shipped behaviour, redirect bug included
      cur = await crawlCurrent(seed.url, BUDGET);
      console.log(`  current : ${cur.pages.length} pages, ${cur.errors.length} errors, ${(cur.ms / 1000).toFixed(1)}s`);
    } catch (e) {
      console.log(`  current : FAILED ${e.message.slice(0, 60)}`);
      cur = { pages: [], errors: [{ error: e.message }], ms: 0, fetched: 0 };
    }

    try {
      cra = await crawlWithCrawlee(seed.url, BUDGET, resolved);
      console.log(`  crawlee : ${cra.pages.length} pages, ${cra.errors.length} errors, ${(cra.ms / 1000).toFixed(1)}s`);
    } catch (e) {
      console.log(`  crawlee : FAILED ${e.message.slice(0, 60)}`);
      cra = { pages: [], errors: [{ error: e.message }], ms: 0, fetched: 0 };
    }

    const row = {
      site: seed.id,
      resolvedSeed: resolved,
      note: seed.note,
      current: {
        fetched: cur.pages.length,
        distinctUrls: distinctUrls(cur.pages),
        distinctContent: distinctContent(cur.pages),
        errors: cur.errors.length,
        seconds: +(cur.ms / 1000).toFixed(1),
        urls: cur.pages.map((p) => p.url),
      },
      crawlee: {
        fetched: cra.pages.length,
        distinctUrls: distinctUrls(cra.pages),
        distinctContent: distinctContent(cra.pages),
        errors: cra.errors.length,
        seconds: +(cra.ms / 1000).toFixed(1),
        urls: cra.pages.map((p) => p.url),
      },
    };
    rows.push(row);

    console.log(
      `  distinct content: current ${row.current.distinctContent}/${row.current.fetched}` +
        `   crawlee ${row.crawlee.distinctContent}/${row.crawlee.fetched}`
    );
    fs.writeFileSync(path.join(OUT, "crawl-compare.json"), JSON.stringify(rows, null, 2));
  }

  console.log("\n" + "=".repeat(88));
  console.log(
    "site".padEnd(12) +
      "fetched".padStart(9) +
      "distinctURL".padStart(13) +
      "distinctContent".padStart(17) +
      "errors".padStart(8) +
      "secs".padStart(8)
  );
  console.log("=".repeat(88));
  for (const r of rows) {
    for (const [name, d] of [["current", r.current], ["crawlee", r.crawlee]]) {
      console.log(
        `${(name === "current" ? r.site : "").padEnd(12)}` +
          `${name.padEnd(0)}`.padStart(0) +
          `${String(d.fetched).padStart(9)}${String(d.distinctUrls).padStart(13)}` +
          `${String(d.distinctContent).padStart(17)}${String(d.errors).padStart(8)}` +
          `${String(d.seconds).padStart(8)}   ${name}`
      );
    }
  }
  console.log("=".repeat(88));
  console.log(`\n-> ${path.join(OUT, "crawl-compare.json")}`);
})();
