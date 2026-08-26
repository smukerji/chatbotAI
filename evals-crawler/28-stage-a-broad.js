/**
 * Stage A, broad run - 12 sites, ground truth from pixels.
 *
 * Ground truth comes from a vision model reading a screenshot. It never sees
 * the HTML, the turndown output, or the DOM detector, so it cannot be circular
 * with anything under test. Validated first on FloatCo and gov.uk, where it
 * independently confirmed 8/8 hand-asserted pairs and found four more I had
 * missed.
 *
 * DOM geometry is deliberately NOT used as ground truth: it is what the
 * winning extractor uses, so scoring against it would partly grade that
 * extractor against itself.
 *
 * A pair is only scored when both its label and its value appear verbatim in
 * the page's own innerText. Anything the vision model transcribed differently
 * from the DOM is excluded and counted, rather than being scored as a failure
 * of the extractors.
 *
 *   node evals-crawler/28-stage-a-broad.js
 *   node evals-crawler/28-stage-a-broad.js --site stripe
 */

const fs = require("fs");
const path = require("path");
const { parse } = require("node-html-parser");
const TurndownService = require("turndown");
const { gfm } = require("turndown-plugin-gfm");
const { GoogleGenAI } = require("@google/genai");
const { extractWithGridTables } = require("./26-dom-tables.js");
require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });

const OUT = path.join(__dirname, "results");
const VISION = "gemini-2.5-pro";
const RATE_IN = 1.25 / 1e6;
const RATE_OUT = 10.0 / 1e6;
const meter = { usd: 0, calls: 0, in: 0, out: 0 };

// 12 sites not used anywhere earlier in this investigation, spread across
// stacks, domains, regions and - importantly - both real <table> markup and
// CSS-grid pseudo-tables, so we can see whether the rewrite helps one without
// damaging the other.
const SITES = [
  { id: "stripe",     url: "https://stripe.com/pricing",                                   stack: "next.js",   kind: "css-grid", domain: "payments" },
  { id: "github",     url: "https://github.com/pricing",                                   stack: "rails",     kind: "css-grid", domain: "devtools" },
  { id: "cloudflare", url: "https://www.cloudflare.com/plans/",                            stack: "custom",    kind: "css-grid", domain: "infra" },
  { id: "slack",      url: "https://slack.com/pricing",                                    stack: "custom",    kind: "css-grid", domain: "saas" },
  { id: "zapier",     url: "https://zapier.com/pricing",                                   stack: "next.js",   kind: "css-grid", domain: "saas" },
  { id: "notion",     url: "https://www.notion.com/pricing",                               stack: "react-spa", kind: "css-grid", domain: "saas" },
  { id: "hetzner",    url: "https://www.hetzner.com/cloud/",                               stack: "custom",    kind: "table",    domain: "hosting-de" },
  { id: "digitalocean", url: "https://www.digitalocean.com/pricing/droplets",              stack: "gatsby",    kind: "table",    domain: "infra" },
  { id: "wikipedia",  url: "https://en.wikipedia.org/wiki/List_of_countries_by_GDP_(nominal)", stack: "mediawiki", kind: "table", domain: "reference" },
  { id: "aws-ec2",    url: "https://aws.amazon.com/ec2/pricing/on-demand/",                stack: "custom",    kind: "table",    domain: "cloud" },
  { id: "gov-uk-vat", url: "https://www.gov.uk/vat-rates",                                 stack: "gov-uk",    kind: "table",    domain: "government" },
  { id: "royalmail",  url: "https://www.royalmail.com/sending/uk/1st-class",               stack: "aem",       kind: "table",    domain: "logistics" },
];

// ── production extractor, verbatim ───────────────────────────────────────────
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

// ── vision ground truth ──────────────────────────────────────────────────────
const ai = new GoogleGenAI({ apiKey: (process.env.GOOGLE_API_KEY || "").trim() });

async function groundTruth(png) {
  const res = await ai.models.generateContent({
    model: VISION,
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { mimeType: "image/png", data: png.toString("base64") } },
          {
            text:
              "Read every table in this page image where each row pairs a NAME with a VALUE - a plan with its price, a band with its rate, a product with its cost, a country with its figure. " +
              "For each row, return the row's label and the value it is paired with, copied EXACTLY as " +
              "printed including currency symbols, commas, percent signs and any asterisks. " +
              'Return ONLY JSON: {"pairs":[{"label":"...","value":"..."}]}. ' +
              "Do not normalise, infer, or convert anything. Omit any value whose label is unclear. " +
              "Ignore tables that are not name/value pairs. Return at most 25 pairs, preferring the most prominent table.",
          },
        ],
      },
    ],
    config: { temperature: 0, responseMimeType: "application/json" },
  });
  const u = res.usageMetadata || {};
  meter.calls++;
  meter.in += u.promptTokenCount || 0;
  meter.out += u.candidatesTokenCount || 0;
  meter.usd += (u.promptTokenCount || 0) * RATE_IN + (u.candidatesTokenCount || 0) * RATE_OUT;
  const text = res.text || "";
  try {
    return JSON.parse(text).pairs || [];
  } catch {
    const m = text.match(/\{[\s\S]*\}/);
    return m ? JSON.parse(m[0]).pairs || [] : [];
  }
}

// ── measurement ──────────────────────────────────────────────────────────────
const squash = (s) => s.replace(/\s+/g, " ").trim();

function measurePair(text, pair, allValues) {
  const t = squash(text);
  const li = t.toLowerCase().indexOf(pair.label.toLowerCase());
  const valueAnywhere = t.includes(pair.value);
  if (li === -1) return { labelFound: false, valueFound: valueAnywhere, attached: false };
  const after = t.slice(li + pair.label.length);
  const vi = after.indexOf(pair.value);
  if (vi === -1) return { labelFound: true, valueFound: valueAnywhere, attached: false };
  const between = after.slice(0, vi);
  const intruders = allValues.filter((v) => v !== pair.value && between.includes(v)).length;
  return { labelFound: true, valueFound: true, attached: intruders === 0, distance: vi, intruders };
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const only = process.argv.includes("--site") ? process.argv[process.argv.indexOf("--site") + 1] : null;
  const sites = SITES.filter((s) => !only || s.id === only);

  const { chromium } = require("playwright");
  const browser = await chromium.launch({ headless: true });
  const td = makeTurndown();
  const all = [];

  for (const site of sites) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1400 } });
    let png, plainHtml, gridHtml, innerText;
    try {
      await page.goto(site.url, { waitUntil: "domcontentloaded", timeout: 60000 });
      await page.waitForTimeout(4000);
      // fullPage, not viewport: pricing tables sit below the fold, and capping
      // at the viewport made the vision model read hero sections and return
      // zero pairs for github, cloudflare and hetzner
      png = await page.screenshot({ fullPage: true, type: "png" });
      innerText = await page.evaluate(() => document.body.innerText || "");
      plainHtml = await page.evaluate(() => document.body.innerHTML);
      const g = await extractWithGridTables(page);
      gridHtml = g.html;
    } catch (e) {
      console.log(`${site.id.padEnd(13)} LOAD FAILED  ${String(e.message).slice(0, 70)}`);
      await page.close();
      continue;
    }
    await page.close();

    let pairs = [];
    try {
      pairs = await groundTruth(png);
    } catch (e) {
      console.log(`${site.id.padEnd(13)} VISION FAILED ${String(e.message).slice(0, 70)}`);
      continue;
    }

    // only score pairs the page itself actually contains verbatim - anything the
    // vision model transcribed differently is excluded, not counted as a miss
    const flat = squash(innerText);
    const usable = pairs.filter(
      (p) => p.label && p.value && flat.includes(p.value) && flat.toLowerCase().includes(String(p.label).toLowerCase())
    );
    const values = [...new Set(usable.map((p) => p.value))];

    const variants = {
      production: extractProduction(parse(plainHtml)).replace(/<img[^>]*>/g, ""),
      turndown: td.turndown(plainHtml),
      "turndown+domtables": td.turndown(gridHtml),
    };

    const row = { ...site, visionPairs: pairs.length, usablePairs: usable.length, variants: {} };
    for (const [name, text] of Object.entries(variants)) {
      const res = usable.map((p) => measurePair(text, p, values));
      row.variants[name] = {
        attached: res.filter((r) => r.attached).length,
        valueFound: res.filter((r) => r.valueFound).length,
        total: usable.length,
        mdRows: (text.match(/^\|.*\|$/gm) || []).length,
      };
    }
    all.push(row);

    const f = (n) => {
      const v = row.variants[n];
      return `${v.attached}/${v.total}`;
    };
    console.log(
      `${site.id.padEnd(13)} ${site.kind.padEnd(9)} vision ${String(pairs.length).padStart(2)} ` +
        `usable ${String(usable.length).padStart(2)}   ` +
        `prod ${f("production").padEnd(6)} turndown ${f("turndown").padEnd(6)} ` +
        `+domtables ${f("turndown+domtables").padEnd(6)}  $${meter.usd.toFixed(4)}`
    );
    fs.writeFileSync(path.join(OUT, "stage-a-broad.json"), JSON.stringify({ all, meter }, null, 2));
  }

  await browser.close();

  // ── aggregate ──────────────────────────────────────────────────────────────
  const names = ["production", "turndown", "turndown+domtables"];
  const agg = (rows, n) => {
    const a = rows.reduce((s, r) => s + (r.variants[n]?.attached || 0), 0);
    const t = rows.reduce((s, r) => s + (r.variants[n]?.total || 0), 0);
    return { a, t, pct: t ? (a / t) * 100 : 0 };
  };

  console.log("\n" + "=".repeat(72));
  console.log("OVERALL".padEnd(24) + "attached".padStart(12) + "rate".padStart(9));
  console.log("=".repeat(72));
  for (const n of names) {
    const s = agg(all, n);
    console.log(n.padEnd(24) + `${s.a}/${s.t}`.padStart(12) + `${s.pct.toFixed(1)}%`.padStart(9));
  }

  for (const kind of ["css-grid", "table"]) {
    const rows = all.filter((r) => r.kind === kind);
    if (!rows.length) continue;
    console.log(`\nBY MARKUP: ${kind}  (${rows.length} sites)`);
    for (const n of names) {
      const s = agg(rows, n);
      console.log("  " + n.padEnd(22) + `${s.a}/${s.t}`.padStart(12) + `${s.pct.toFixed(1)}%`.padStart(9));
    }
  }

  console.log("\n" + "=".repeat(72));
  console.log(`sites completed ${all.length}/${sites.length}`);
  console.log(`vision spend $${meter.usd.toFixed(6)}  (${meter.calls} calls)`);
  console.log(`-> ${path.join(OUT, "stage-a-broad.json")}`);
})();
