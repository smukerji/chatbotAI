/**
 * Validate the label/value pairs Stage A is scored against, using a vision
 * model on a screenshot.
 *
 * Why this exists: Stage A verified that every value and label EXISTS on the
 * page, but the pairing - "$900 belongs to 2 floats per month" - was asserted
 * by hand from reading extracted text. That is the same text under test, so
 * the ground truth risked being circular: an extractor could score 8/8 for
 * faithfully reproducing a mistake.
 *
 * A vision model never sees the HTML, the turndown output, or the DOM
 * detector. It sees pixels, which is what the customer sees. If it independently
 * produces the same pairs, the ground truth holds. If not, Stage A's result is
 * measuring the wrong thing and has to be redone.
 *
 *   node evals-crawler/27-verify-pairs-vision.js
 */

const fs = require("fs");
const path = require("path");
const { GoogleGenAI } = require("@google/genai");
require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });

const OUT = path.join(__dirname, "results");
const MODEL = "gemini-2.5-pro";
// published rates, same as the judge
const RATE_IN = 1.25 / 1e6;
const RATE_OUT = 10.0 / 1e6;

const meter = { usd: 0, calls: 0, in: 0, out: 0 };

const PAGES = [
  {
    id: "floatco-pricing",
    url: "https://floatco.com/pricing",
    ask:
      "This is a float therapy studio's pricing page. Read the membership pricing tables. " +
      "For every plan shown, return the plan name exactly as printed and its price exactly as printed.",
    asserted: [
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
    ask:
      "This is the UK government's income tax rates page. Read the tax band table. " +
      "For every band shown, return the band name exactly as printed and its tax rate exactly as printed.",
    asserted: [
      { label: "Basic rate", value: "20%" },
      { label: "Higher rate", value: "40%" },
      { label: "Additional rate", value: "45%" },
    ],
  },
];

const ai = new GoogleGenAI({ apiKey: (process.env.GOOGLE_API_KEY || "").trim() });

async function readPairsFromImage(pngBuffer, ask) {
  const res = await ai.models.generateContent({
    model: MODEL,
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { mimeType: "image/png", data: pngBuffer.toString("base64") } },
          {
            text:
              ask +
              "\n\nReturn ONLY JSON: {\"pairs\":[{\"label\":\"...\",\"value\":\"...\"}]}. " +
              "Copy text exactly as it appears in the image, including currency symbols and commas. " +
              "Do not infer or normalise. If a price has no clear label, omit it.",
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

const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9$£€%.,]/g, "");

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const { chromium } = require("playwright");
  const browser = await chromium.launch({ headless: true });
  const report = [];

  for (const page of PAGES) {
    const p = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
    await p.goto(page.url, { waitUntil: "domcontentloaded", timeout: 60000 });
    await p.waitForTimeout(2500);
    const shot = await p.screenshot({ fullPage: true, type: "png" });
    fs.writeFileSync(path.join(OUT, `shot-${page.id}.png`), shot);
    await p.close();

    let seen = [];
    try {
      seen = await readPairsFromImage(shot, page.ask);
    } catch (e) {
      console.log(`${page.id}: VISION FAILED ${String(e.message).slice(0, 120)}`);
      continue;
    }

    console.log(`\n=== ${page.id} ===`);
    console.log(`  vision model read ${seen.length} pairs from the screenshot`);
    for (const s of seen.slice(0, 12)) console.log(`      ${String(s.label).slice(0, 34).padEnd(36)} ${s.value}`);

    console.log(`\n  checking the ${page.asserted.length} pairs Stage A is scored against:`);
    const rows = [];
    for (const a of page.asserted) {
      // does the vision model pair this value with this label?
      const match = seen.find((s) => norm(s.value) === norm(a.value));
      let verdict, detail;
      if (!match) {
        verdict = "NOT SEEN";
        detail = "vision model did not report this value at all";
      } else if (norm(match.label).includes(norm(a.label)) || norm(a.label).includes(norm(match.label))) {
        verdict = "CONFIRMED";
        detail = `vision: "${match.label}"`;
      } else {
        verdict = "CONTRADICTED";
        detail = `vision pairs ${a.value} with "${match.label}", not "${a.label}"`;
      }
      rows.push({ ...a, verdict, detail });
      console.log(`      ${a.label.padEnd(22)} ${a.value.padEnd(8)} ${verdict.padEnd(13)} ${detail}`);
    }
    report.push({ page: page.id, visionPairs: seen, checks: rows });
  }

  await browser.close();
  fs.writeFileSync(path.join(OUT, "pair-validation.json"), JSON.stringify({ report, meter }, null, 2));

  const all = report.flatMap((r) => r.checks);
  const conf = all.filter((r) => r.verdict === "CONFIRMED").length;
  const contra = all.filter((r) => r.verdict === "CONTRADICTED").length;
  const unseen = all.filter((r) => r.verdict === "NOT SEEN").length;

  console.log("\n" + "=".repeat(66));
  console.log(`CONFIRMED ${conf}/${all.length}   CONTRADICTED ${contra}   NOT SEEN ${unseen}`);
  console.log("=".repeat(66));
  if (contra) {
    console.log("Stage A's ground truth is WRONG on at least one pair - the 8/8 result");
    console.log("does not mean what it appeared to mean and must be redone.");
  } else if (unseen) {
    console.log("Some pairs could not be checked; treat those as unvalidated.");
  } else {
    console.log("Ground truth independently confirmed from pixels. Stage A stands.");
  }
  console.log(`\nspend $${meter.usd.toFixed(6)}  (${meter.calls} calls, ${meter.in} in / ${meter.out} out)`);
  console.log(`-> ${path.join(OUT, "pair-validation.json")}  screenshots saved alongside`);
})();
