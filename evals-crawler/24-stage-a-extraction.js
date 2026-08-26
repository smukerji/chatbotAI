/**
 * Stage A - extraction quality, measured deterministically.
 *
 * No LLM judge anywhere in this file. Every number is a string operation, so
 * nothing here is sensitive to chunk size, judge drift, or model family - the
 * three things that made earlier results hard to defend.
 *
 * The question is narrow: after extraction, is each value still attached to the
 * label it belongs to?
 *
 *   valuePresent    is "$900" in the text at all
 *   labelPresent    is "2 floats per month" in the text at all
 *   distance        characters between the end of the label and the value
 *   intruders       how many OTHER values from the same table sit between them
 *
 * `intruders` is the one that matters. On a correctly extracted table it is 0 -
 * the price follows its own label. On FloatCo's CSS-grid pricing every label is
 * emitted first and every price afterwards, so the price for "2 floats per
 * month" has other prices in front of it and the model has to guess.
 *
 *   node evals-crawler/24-stage-a-extraction.js
 */

const fs = require("fs");
const path = require("path");
const { parse } = require("node-html-parser");
const TurndownService = require("turndown");
const { gfm } = require("turndown-plugin-gfm");

const OUT = path.join(__dirname, "results");

/**
 * Label/value pairs read off the live pages. 18-verify-facts.js already
 * confirmed every value below is present; this file additionally asserts the
 * label is present, and reports rather than assumes if it is not.
 */
const PAGES = [
  {
    id: "floatco-pricing",
    url: "https://floatco.com/pricing",
    tableValues: ["$500", "$900", "$1,600", "$800", "$1,800"],
    pairs: [
      { label: "1 float per month", value: "$500" },
      { label: "2 floats per month", value: "$900" },
      { label: "4 floats per month", value: "$1,600" },
      { label: "1 CP per week", value: "$800" },
      { label: "3 CP per week", value: "$1,800" },
    ],
  },
  {
    id: "gov-uk-tax",
    url: "https://www.gov.uk/income-tax-rates",
    tableValues: ["20%", "40%", "45%"],
    pairs: [
      { label: "Basic rate", value: "20%" },
      { label: "Higher rate", value: "40%" },
      { label: "Additional rate", value: "45%" },
    ],
  },
  {
    id: "vercel-limits",
    url: "https://vercel.com/docs/limits",
    tableValues: [],
    pairs: [],
  },
];

// ── production extractor, verbatim from route.ts ─────────────────────────────
const imageLinkRegex =
  /^https?:\/\/(?:[\w\-]+\.)+[a-zA-Z]{2,20}(?:\/[^\s?]+)*(?:\.(?:jpg|jpeg|png|gif|bmp|svg|webp|tiff))(?:\?.*)?$/i;

function extractProduction(el) {
  if (el.tagName === "SCRIPT" || el.tagName === "SVG" || el.tagName === "STYLE") return "";
  if (el.tagName === "IMG") {
    const s = el.getAttribute("src");
    return imageLinkRegex.test(s) ? `      image: ${decodeURI(s)}          ` : "";
  }
  if (el.childNodes.length === 0) return el.text;
  let t = "";
  el.childNodes.forEach((c) => (t += extractProduction(c)));
  return t.replace(/(\r\n|\n|\r|\t|)/gm, "").trim();
}

function makeTurndown() {
  const td = new TurndownService({ headingStyle: "atx" });
  td.use(gfm);
  td.remove(["script", "style", "noscript", "iframe", "svg"]);
  td.addRule("dropImages", { filter: "img", replacement: () => "" });
  return td;
}

// ── measurement ──────────────────────────────────────────────────────────────
const squash = (s) => s.replace(/\s+/g, " ").trim();

/**
 * Find the label, then the first occurrence of its value after it, and count
 * how many other table values appear in between.
 */
function measurePair(text, pair, allValues) {
  const t = squash(text);
  const li = t.toLowerCase().indexOf(pair.label.toLowerCase());
  const anyValue = t.includes(pair.value);

  if (li === -1) {
    return { ...pair, labelPresent: false, valuePresent: anyValue, distance: null, intruders: null };
  }

  const after = t.slice(li + pair.label.length);
  const vi = after.indexOf(pair.value);
  if (vi === -1) {
    return { ...pair, labelPresent: true, valuePresent: anyValue, distance: null, intruders: null };
  }

  const between = after.slice(0, vi);
  const intruders = allValues.filter((v) => v !== pair.value && between.includes(v)).length;
  return { ...pair, labelPresent: true, valuePresent: true, distance: vi, intruders };
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const { PlaywrightCrawler, Configuration } = require("crawlee");
  const td = makeTurndown();
  const rows = [];

  for (const page of PAGES) {
    if (!page.pairs.length) continue;

    let html = null;
    const crawler = new PlaywrightCrawler(
      {
        maxRequestsPerCrawl: 1,
        maxRequestRetries: 1,
        navigationTimeoutSecs: 45,
        headless: true,
        preNavigationHooks: [async (_c, g) => { g.waitUntil = "domcontentloaded"; }],
        async requestHandler({ page: p }) {
          let prev = -1;
          for (let i = 0; i < 6; i++) {
            const n = await p.evaluate(() => (document.body.innerText || "").length);
            if (n === prev && n > 0) break;
            prev = n;
            await p.waitForTimeout(400);
          }
          html = await p.evaluate(() => document.body.innerHTML);
        },
      },
      new Configuration({ persistStorage: false })
    );
    await crawler.run([page.url]);
    if (!html) {
      console.log(`${page.id}: FETCH FAILED`);
      continue;
    }

    const variants = {
      production: extractProduction(parse(html)).replace(/<img[^>]*>/g, ""),
      turndown: td.turndown(html),
    };

    console.log(`\n=== ${page.id} ===`);
    for (const [name, text] of Object.entries(variants)) {
      const results = page.pairs.map((p) => measurePair(text, p, page.tableValues));
      const attached = results.filter((r) => r.intruders === 0).length;
      const found = results.filter((r) => r.valuePresent).length;
      const labelled = results.filter((r) => r.labelPresent).length;
      const dists = results.filter((r) => r.distance !== null).map((r) => r.distance);
      const meanDist = dists.length ? dists.reduce((a, b) => a + b, 0) / dists.length : null;

      rows.push({ page: page.id, variant: name, chars: text.length, results, attached, found, labelled, meanDist });

      console.log(
        `  ${name.padEnd(12)} values ${found}/${page.pairs.length}  ` +
          `labels ${labelled}/${page.pairs.length}  ` +
          `correctly attached ${attached}/${page.pairs.length}  ` +
          `mean gap ${meanDist === null ? "-" : Math.round(meanDist)} chars`
      );
      for (const r of results) {
        const verdict =
          !r.valuePresent ? "VALUE MISSING"
          : !r.labelPresent ? "LABEL MISSING"
          : r.distance === null ? "value never follows its label"
          : r.intruders === 0 ? `attached (gap ${r.distance})`
          : `DETACHED - ${r.intruders} other value(s) in between, gap ${r.distance}`;
        console.log(`      ${r.label.padEnd(22)} ${r.value.padEnd(8)} ${verdict}`);
      }
    }
  }

  fs.writeFileSync(path.join(OUT, "stage-a.json"), JSON.stringify(rows, null, 2));

  console.log("\n" + "=".repeat(70));
  console.log("variant".padEnd(14) + "values".padStart(9) + "attached".padStart(11) + "mean gap".padStart(11));
  console.log("=".repeat(70));
  for (const name of ["production", "turndown"]) {
    const r = rows.filter((x) => x.variant === name);
    const pairs = r.reduce((a, b) => a + b.results.length, 0);
    const found = r.reduce((a, b) => a + b.found, 0);
    const att = r.reduce((a, b) => a + b.attached, 0);
    const d = r.flatMap((x) => x.results.map((y) => y.distance)).filter((x) => x !== null);
    const md = d.length ? d.reduce((a, b) => a + b, 0) / d.length : null;
    console.log(
      name.padEnd(14) + `${found}/${pairs}`.padStart(9) + `${att}/${pairs}`.padStart(11) +
      (md === null ? "-" : String(Math.round(md))).padStart(11)
    );
  }
  console.log("=".repeat(70));
  console.log("attached = value directly follows its own label with no other value between");
  console.log(`\n-> ${path.join(OUT, "stage-a.json")}   cost $0.00`);
})();
