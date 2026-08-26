/**
 * Stage A, third variant - repair flattened tables with schema extraction.
 *
 * Stage A established that production and turndown both attach only 5 of 8
 * label/value pairs, and both fail identically on CSS-grid tables while both
 * succeed on real <table> markup. Nothing is lost in extraction; the ordering
 * is simply wrong. This attempts the repair.
 *
 * Three safeguards, because an LLM rewriting page content is exactly where
 * silent damage happens - Readability already deleted every price on this page
 * earlier in the investigation:
 *
 *   1. only regions that look flattened are sent, detected without an LLM
 *   2. the model may only reorder values it was given, never invent
 *   3. the output is rejected unless every original value survives and no new
 *      value appears
 *
 * A rejected repair falls back to the original text, so the worst case is
 * today's behaviour rather than something worse.
 *
 *   node evals-crawler/25-schema-repair.js
 */

const fs = require("fs");
const path = require("path");
const { OpenAI } = require("openai");
require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });

const OUT = path.join(__dirname, "results");
const MODEL = "gpt-4o-mini"; // proven response_format json_schema support
const RATE_IN = 0.15 / 1e6;
const RATE_OUT = 0.60 / 1e6;

const openai = new OpenAI({ apiKey: (process.env.NEXT_PUBLIC_OPENAI_KEY || "").trim() });
const meter = { usd: 0, calls: 0, in: 0, out: 0 };

// Anchored thousands groups rather than [\d,]* - the greedy version swallowed
// the comma in prose like "£12,570, and above", so the original value was
// recorded as "£12,570," while the model correctly returned "£12,570" and every
// repair was rejected as having lost a value.
const VALUE_RE = /(?:[$£€]\s?\d{1,3}(?:,\d{3})*(?:\.\d+)?|\b\d{1,3}(?:,\d{3})*(?:\.\d+)?\s?%)/g;

/**
 * A region is "flattened" when its values cluster instead of alternating with
 * labels. Same signal as the alternation measure from Stage 3, applied to a
 * window rather than a whole page.
 */
function findFlattenedRegions(text, { minValues = 3, window = 1200 } = {}) {
  const regions = [];
  const values = [...text.matchAll(VALUE_RE)];
  if (values.length < minValues) return regions;

  // group values that sit close together - a price table emits them in a burst
  let group = [values[0]];
  for (let i = 1; i < values.length; i++) {
    if (values[i].index - group[group.length - 1].index < 120) group.push(values[i]);
    else {
      if (group.length >= minValues) regions.push(group);
      group = [values[i]];
    }
  }
  if (group.length >= minValues) regions.push(group);

  return regions.map((g) => {
    const start = Math.max(0, g[0].index - window);
    const end = Math.min(text.length, g[g.length - 1].index + 200);
    const slice = text.slice(start, end);
    // Two different value sets, because the guard is asymmetric:
    //   tableValues  the tight cluster that triggered detection - these ARE the
    //                table and every one of them must survive a repair
    //   windowValues everything in the text the model can see, including prose
    //                numbers; the model may cite these without it being an
    //                invention, but it need not turn them into rows
    return {
      start,
      end,
      text: slice,
      tableValues: g.map((m) => m[0]),
      windowValues: slice.match(VALUE_RE) || [],
    };
  });
}

async function repairRegion(region) {
  const schema = {
    type: "object",
    properties: {
      rows: {
        type: "array",
        items: {
          type: "object",
          properties: { label: { type: "string" }, value: { type: "string" } },
          required: ["label", "value"],
          additionalProperties: false,
        },
      },
    },
    required: ["rows"],
    additionalProperties: false,
  };

  const r = await openai.chat.completions.create({
    model: MODEL,
    temperature: 0,
    response_format: { type: "json_schema", json_schema: { name: "table_rows", strict: true, schema } },
    messages: [
      {
        role: "system",
        content:
          "You are repairing a pricing or specification table whose labels and values were separated " +
          "when the page was converted to text. Pair each value with the label it belongs to. " +
          "Use ONLY labels and values present in the input. Never invent, never omit a value, never " +
          "alter a value's characters.",
      },
      { role: "user", content: region.text },
    ],
  });

  meter.calls++;
  meter.in += r.usage.prompt_tokens;
  meter.out += r.usage.completion_tokens;
  meter.usd += r.usage.prompt_tokens * RATE_IN + r.usage.completion_tokens * RATE_OUT;

  return JSON.parse(r.choices[0].message.content).rows || [];
}

/**
 * Asymmetric guard:
 *   every value of the table itself must survive  (losing a price is the harm)
 *   nothing may appear that is not somewhere in the text the model saw
 * Prose numbers in the surrounding window need not become rows.
 */
function verify(rows, region) {
  const strip = (v) => v.replace(/\s/g, "");
  const produced = rows.map((r) => strip(r.value));
  const table = region.tableValues.map(strip);
  const window = region.windowValues.map(strip);
  const missing = table.filter((v) => !produced.includes(v));
  const invented = produced.filter((v) => !window.includes(v));
  return { ok: missing.length === 0 && invented.length === 0, missing, invented };
}

async function repairText(text) {
  const regions = findFlattenedRegions(text);
  if (!regions.length) return { text, regions: 0, repaired: 0, rejected: 0 };

  let out = text;
  let repaired = 0;
  let rejected = 0;

  // splice from the end so earlier offsets stay valid
  for (const region of [...regions].reverse()) {
    let rows;
    try {
      rows = await repairRegion(region);
    } catch (e) {
      rejected++;
      continue;
    }
    const check = verify(rows, region);
    if (!check.ok) {
      rejected++;
      console.log(
        `      rejected repair: ${check.missing.length} value(s) lost, ${check.invented.length} invented` +
          (check.missing.length ? ` [${check.missing.slice(0, 3).join(", ")}]` : "")
      );
      continue;
    }
    const rebuilt = "\n" + rows.map((r) => `${r.label} — ${r.value}`).join("\n") + "\n";
    out = out.slice(0, region.start) + rebuilt + out.slice(region.end);
    repaired++;
  }
  return { text: out, regions: regions.length, repaired, rejected };
}

module.exports = { repairText, findFlattenedRegions, meter };

// ── run standalone against the Stage A pages ─────────────────────────────────
if (require.main === module) {
  const { parse } = require("node-html-parser");
  const TurndownService = require("turndown");
  const { gfm } = require("turndown-plugin-gfm");

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
  ];

  const squash = (s) => s.replace(/\s+/g, " ").trim();
  function measurePair(text, pair, allValues) {
    const t = squash(text);
    const li = t.toLowerCase().indexOf(pair.label.toLowerCase());
    const anyValue = t.includes(pair.value);
    if (li === -1) return { ...pair, labelPresent: false, valuePresent: anyValue, intruders: null };
    const after = t.slice(li + pair.label.length);
    const vi = after.indexOf(pair.value);
    if (vi === -1) return { ...pair, labelPresent: true, valuePresent: anyValue, intruders: null };
    const between = after.slice(0, vi);
    return {
      ...pair,
      labelPresent: true,
      valuePresent: true,
      distance: vi,
      intruders: allValues.filter((v) => v !== pair.value && between.includes(v)).length,
    };
  }

  (async () => {
    const { PlaywrightCrawler, Configuration } = require("crawlee");
    const td = new TurndownService({ headingStyle: "atx" });
    td.use(gfm);
    td.remove(["script", "style", "noscript", "iframe", "svg"]);
    td.addRule("dropImages", { filter: "img", replacement: () => "" });

    const rows = [];
    for (const page of PAGES) {
      let html = null;
      const crawler = new PlaywrightCrawler(
        {
          maxRequestsPerCrawl: 1,
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
      if (!html) continue;

      const base = td.turndown(html);
      const rep = await repairText(base);

      console.log(`\n=== ${page.id} ===`);
      console.log(`  regions detected ${rep.regions}, repaired ${rep.repaired}, rejected ${rep.rejected}`);

      for (const [name, text] of [["turndown", base], ["turndown+repair", rep.text]]) {
        const res = page.pairs.map((p) => measurePair(text, p, page.tableValues));
        const attached = res.filter((r) => r.intruders === 0).length;
        const found = res.filter((r) => r.valuePresent).length;
        rows.push({ page: page.id, variant: name, attached, found, total: page.pairs.length, res });
        console.log(`  ${name.padEnd(18)} values ${found}/${page.pairs.length}  attached ${attached}/${page.pairs.length}`);
        for (const r of res) {
          const v = !r.valuePresent ? "VALUE MISSING"
            : r.intruders === null ? "value never follows label"
            : r.intruders === 0 ? "attached"
            : `DETACHED (${r.intruders} between)`;
          console.log(`      ${r.label.padEnd(22)} ${r.value.padEnd(8)} ${v}`);
        }
      }
    }

    fs.mkdirSync(OUT, { recursive: true });
    fs.writeFileSync(path.join(OUT, "stage-a-repair.json"), JSON.stringify({ rows, meter }, null, 2));

    console.log("\n" + "=".repeat(60));
    for (const name of ["turndown", "turndown+repair"]) {
      const r = rows.filter((x) => x.variant === name);
      const att = r.reduce((a, b) => a + b.attached, 0);
      const tot = r.reduce((a, b) => a + b.total, 0);
      const fnd = r.reduce((a, b) => a + b.found, 0);
      console.log(`${name.padEnd(20)} values ${fnd}/${tot}   correctly attached ${att}/${tot}`);
    }
    console.log("=".repeat(60));
    console.log(`spend $${meter.usd.toFixed(6)}  (${meter.calls} calls, ${meter.in} in / ${meter.out} out)`);
  })();
}
