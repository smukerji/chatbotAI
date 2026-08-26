/**
 * Stage 4 - end-to-end retrieval quality. The only stage that answers whether
 * any of this beats the 0.467 baseline.
 *
 * Four variants, same sites, same queries, same embedding model. Only the
 * processing differs, so a score change is attributable to the variant.
 *
 *   V0  current crawl + current extract + fixed chunks   (the shipped baseline)
 *   V1  current crawl + turndown        + markdown       (extraction isolated)
 *   V2  crawlee       + current extract + fixed chunks   (crawling isolated)
 *   V3  crawlee       + turndown        + markdown       (both)
 *
 * Judging is done here rather than through DeepEval so every token is counted.
 * The relevancy definition matches DeepEval's ContextualRelevancy: of the
 * statements in the retrieved context, what proportion bear on the question.
 *
 * Writes only to namespaces prefixed evalstage4-, and deletes them at the end.
 *
 *   node evals-crawler/17-stage4.js
 *   node evals-crawler/17-stage4.js --dry     (no spend, prints the plan)
 */

const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });

const { Pinecone } = require("@pinecone-database/pinecone");
const { OpenAI } = require("openai");
const { parse } = require("node-html-parser");
const TurndownService = require("turndown");
const { gfm } = require("turndown-plugin-gfm");
const puppeteer = require("puppeteer");

const OUT = path.join(__dirname, "results");
const DRY = process.argv.includes("--dry");

const RATES = {
  "text-embedding-ada-002": { in: 0.1 / 1e6, out: 0 },
  "gpt-4.1": { in: 2.0 / 1e6, out: 8.0 / 1e6 },
  "gpt-4.1-mini": { in: 0.4 / 1e6, out: 1.6 / 1e6 },
};

// ── running cost meter ───────────────────────────────────────────────────────
const meter = { calls: 0, byModel: {}, usd: 0 };
function charge(model, promptTokens, completionTokens = 0) {
  const r = RATES[model];
  const c = promptTokens * r.in + completionTokens * r.out;
  meter.usd += c;
  meter.calls++;
  const b = (meter.byModel[model] ||= { calls: 0, inTok: 0, outTok: 0, usd: 0 });
  b.calls++;
  b.inTok += promptTokens;
  b.outTok += completionTokens;
  b.usd += c;
  return c;
}

// ── sites and probes ─────────────────────────────────────────────────────────
// probes are hand-written from what customers actually ask, so they are neutral
// to how any variant chunks the page
// `must` facts appear only where the value has been read off the live page and
// confirmed. Everywhere else the probe carries no facts and is scored on
// relevancy alone - inventing expected answers would bias the comparison.
const SITES = [
  {
    id: "floatco",
    seed: "https://floatco.com",
    probes: [
      { q: "how much is a single float session", must: ["$900"] },
      { q: "what does the 2 floats per month membership cost", must: ["$900"] },
      { q: "what does the 1 float per month membership cost", must: ["$500"] },
      { q: "what does the 4 floats per month membership cost", must: ["$1,600"] },
      { q: "how much is the cold plunge membership", must: ["$800"] },
      { q: "what is the discount for floating before 3pm on weekdays", must: [] },
      { q: "where are you located", must: ["Caine"] },
      { q: "what are your opening hours on tuesday", must: [] },
      { q: "do you offer gift cards", must: [] },
      { q: "how long is a float session", must: [] },
    ],
  },
  {
    id: "musaffa",
    seed: "https://musaffa.com",
    probes: [
      { q: "what is halal stock screening", must: [] },
      { q: "how do you screen stocks for shariah compliance", must: [] },
      { q: "what does the subscription cost", must: [] },
      { q: "do you cover ETFs", must: [] },
      { q: "what is purification", must: [] },
    ],
  },
  {
    id: "livall",
    seed: "https://livall.com",
    probes: [
      { q: "what smart helmets do you sell", must: [] },
      { q: "how much does a helmet cost", must: [] },
      { q: "do the helmets have turn signals", must: [] },
      { q: "what is the battery life", must: [] },
      { q: "what is your shipping policy", must: [] },
    ],
  },
  {
    id: "gov-uk",
    seed: "https://www.gov.uk/income-tax-rates",
    probes: [
      { q: "what is the personal allowance", must: ["12,570"], expected: "The personal Allowance is 12,570 pounds." },
      { q: "what is the basic rate of income tax", must: ["20%"], expected: "The basic rate of Income Tax is 20%." },
      { q: "what is the higher rate of income tax", must: ["40%"], expected: "The higher rate of Income Tax is 40%." },
      { q: "what is the additional rate of income tax", must: ["45%"], expected: "The additional rate of Income Tax is 45%." },
      { q: "when does the personal allowance start to reduce", must: ["100,000"], expected: "The Personal Allowance goes down when income is above 100,000 pounds." },
    ],
  },
  {
    id: "creolestudios",
    seed: "https://www.creolestudios.com",
    probes: [
      { q: "what services do you offer", must: [] },
      { q: "do you build mobile apps", must: [] },
      { q: "how can I contact you", must: [] },
      { q: "do you do cloud development", must: [] },
    ],
  },
  {
    id: "yumsing",
    seed: "https://www.yumsinghouse.com",
    probes: [
      { q: "what is on the menu", must: [] },
      { q: "where are you located", must: [] },
      { q: "what are your opening hours", must: [] },
      { q: "how do I contact you", must: [] },
    ],
  },
  {
    id: "imi-gov-my",
    seed: "https://esd.imi.gov.my/portal/faq/",
    probes: [
      { q: "how do I apply for a visa", must: [] },
      { q: "what documents are required", must: [] },
      { q: "how long does processing take", must: [] },
      { q: "what is myxpats", must: [] },
    ],
  },
  {
    id: "w3schools",
    seed: "https://www.w3schools.com/html/",
    probes: [
      { q: "how do I create a table in html", must: ["<table>"], expected: "An HTML table is defined with the <table> tag." },
      { q: "what tag defines a table row", must: ["<tr>"], expected: "Each table row is defined with the <tr> tag." },
      { q: "what tag defines a table header cell", must: ["<th>"], expected: "Each table header cell is defined with the <th> tag." },
      { q: "how do I add a border to a table", must: [] },
    ],
  },
];

// ── production extractor + chunker, verbatim ─────────────────────────────────
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

const chunkFixed = (text) => {
  const o = [];
  for (let s = 0; s < text.length; s += 1800) o.push(text.substring(s, s + 2000));
  return o;
};

function chunkMarkdown(md, max = 2000, min = 400) {
  const parts = [];
  for (const section of md.split(/\n(?=#{1,6}\s)/)) {
    if (section.length <= max) {
      if (section.trim()) parts.push(section.trim());
      continue;
    }
    let buf = "";
    for (const para of section.split(/\n{2,}/)) {
      if (buf && (buf + "\n\n" + para).length > max) {
        parts.push(buf.trim());
        buf = para;
      } else buf = buf ? buf + "\n\n" + para : para;
    }
    if (buf.trim()) parts.push(buf.trim());
  }
  const out = [];
  for (const p of parts) {
    const last = out[out.length - 1];
    if (last && last.length < min && (last + "\n\n" + p).length <= max) out[out.length - 1] = last + "\n\n" + p;
    else out.push(p);
  }
  return out;
}

const td = (() => {
  const t = new TurndownService({ headingStyle: "atx" });
  t.use(gfm);
  t.remove(["script", "style", "noscript", "iframe", "svg"]);
  t.addRule("dropImages", { filter: "img", replacement: () => "" });
  return t;
})();

// ── crawlers ─────────────────────────────────────────────────────────────────
const BUDGET = 8;

async function crawlCurrent(seed) {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  const visited = new Map();
  const pending = [seed];
  const out = [];
  while (pending.length && out.length < BUDGET) {
    const url = pending.shift();
    if (!url || visited.get(url)) continue;
    visited.set(url, true);
    try {
      await page.goto(url, { waitUntil: "networkidle2", timeout: 45000 });
      out.push({ url, html: await page.$eval("body", (b) => b.innerHTML) });
      const hrefs = await page.$$eval("a", (ls) => ls.map((l) => l.href).filter(Boolean));
      for (const h of hrefs) if (h.startsWith(seed) && !visited.get(h)) pending.push(h);
    } catch {}
  }
  await browser.close();
  return out;
}

async function crawlCrawlee(seed) {
  const { PlaywrightCrawler, Configuration } = require("crawlee");
  const out = [];
  const b = await puppeteer.launch({ headless: "new" });
  let landed = seed;
  try {
    const p = await b.newPage();
    await p.goto(seed, { waitUntil: "domcontentloaded", timeout: 45000 });
    landed = p.url();
  } catch {} finally {
    await b.close();
  }
  const host = new URL(landed).hostname.replace(/^www\./, "");

  const crawler = new PlaywrightCrawler(
    {
      maxRequestsPerCrawl: BUDGET,
      maxRequestRetries: 1,
      navigationTimeoutSecs: 45,
      headless: true,
      preNavigationHooks: [async (_c, g) => { g.waitUntil = "domcontentloaded"; }],
      async requestHandler({ page, request, enqueueLinks }) {
        let prev = -1;
        for (let i = 0; i < 6; i++) {
          const n = await page.evaluate(() => (document.body.innerText || "").length);
          if (n === prev && n > 0) break;
          prev = n;
          await page.waitForTimeout(400);
        }
        out.push({ url: request.loadedUrl, html: await page.evaluate(() => document.body.innerHTML) });
        await enqueueLinks({
          strategy: "all",
          transformRequestFunction(req) {
            try {
              const u = new URL(req.url);
              u.protocol = "https:";
              u.hostname = u.hostname.replace(/^www\./, "");
              u.hash = "";
              if (u.pathname !== "/" && u.pathname.endsWith("/")) u.pathname = u.pathname.slice(0, -1);
              if (u.hostname.replace(/^www\./, "") !== host) return false;
              if (/\.(mp4|jpg|jpeg|png|gif|svg|webp|pdf|zip|css|js)$/i.test(u.pathname)) return false;
              req.url = u.href;
              return req;
            } catch {
              return false;
            }
          },
        });
      },
    },
    new Configuration({ persistStorage: false })
  );
  await crawler.run([landed]);
  return out;
}

const VARIANTS = [
  { id: "V0", label: "current + current + fixed", crawl: crawlCurrent, extract: "prod", chunk: "fixed" },
  { id: "V1", label: "current + turndown + md", crawl: crawlCurrent, extract: "md", chunk: "md" },
  { id: "V2", label: "crawlee + current + fixed", crawl: crawlCrawlee, extract: "prod", chunk: "fixed" },
  { id: "V3", label: "crawlee + turndown + md", crawl: crawlCrawlee, extract: "md", chunk: "md" },
];

function process_(pages, extract, chunk) {
  const chunks = [];
  for (const p of pages) {
    const text = extract === "prod" ? extractProduction(parse(p.html)).replace(/<img[^>]*>/g, "") : td.turndown(p.html);
    const cs = chunk === "fixed" ? chunkFixed(text) : chunkMarkdown(text);
    for (const c of cs) if (c.trim().length > 40) chunks.push({ text: c, url: p.url });
  }
  return chunks;
}

// ── judge ────────────────────────────────────────────────────────────────────
const openai = new OpenAI({ apiKey: (process.env.NEXT_PUBLIC_OPENAI_KEY || "").trim() });

async function embed(texts) {
  const r = await openai.embeddings.create({ model: "text-embedding-ada-002", input: texts });
  charge("text-embedding-ada-002", r.usage.total_tokens);
  return r.data.map((d) => d.embedding);
}

/**
 * Answer the question from the retrieved chunks only, the way the application
 * does. Scoring happens afterwards in DeepEval so the numbers sit on the same
 * scale as the 0.467 baseline; this step exists to produce an actual_output for
 * the metrics that need one (faithfulness, answer relevancy).
 */
async function generateAnswer(question, contexts) {
  const r = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      {
        role: "system",
        content:
          "Answer using ONLY the provided context. If the context does not contain the answer, say you do not have that information. Be concise.",
      },
      {
        role: "user",
        content: `Context:\n${contexts.map((c, i) => `[${i + 1}] ${c.slice(0, 2000)}`).join("\n\n")}\n\nQuestion: ${question}`,
      },
    ],
    temperature: 0,
    max_tokens: 220,
  });
  charge("gpt-4.1-mini", r.usage.prompt_tokens, r.usage.completion_tokens);
  return r.choices[0].message.content.trim();
}

// ── run ──────────────────────────────────────────────────────────────────────
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const pc = new Pinecone({ apiKey: (process.env.NEXT_PUBLIC_PINECONE_KEY || "").trim() });
  const index = pc.index((process.env.NEXT_PUBLIC_PINECONE_INDEX || "").trim());

  const results = [];
  const namespaces = [];

  for (const site of SITES) {
    const crawled = {};
    for (const v of VARIANTS) {
      const key = v.crawl === crawlCurrent ? "current" : "crawlee";
      if (!crawled[key]) {
        console.log(`\n[${site.id}] crawling with ${key} ...`);
        crawled[key] = await v.crawl(site.seed);
        console.log(`  ${crawled[key].length} pages`);
      }
      const chunks = process_(crawled[key], v.extract, v.chunk);
      const ns = `evalstage4-${site.id}-${v.id}`.toLowerCase();
      namespaces.push(ns);
      console.log(`  ${v.id} ${v.label.padEnd(28)} ${chunks.length} chunks -> ${ns}`);

      if (DRY) continue;

      // embed and upsert in batches
      for (let i = 0; i < chunks.length; i += 50) {
        const batch = chunks.slice(i, i + 50);
        const vecs = await embed(batch.map((c) => c.text.slice(0, 6000)));
        await index.namespace(ns).upsert(
          batch.map((c, j) => ({
            id: `${ns}-${i + j}`,
            values: vecs[j],
            metadata: { content: c.text.slice(0, 3000), url: c.url },
          }))
        );
      }
      await new Promise((r) => setTimeout(r, 4000));

      // query
      for (const probe of site.probes) {
        const [qv] = await embed([probe.q]);
        const res = await index.namespace(ns).query({ vector: qv, topK: 3, includeMetadata: true });
        const ctx = (res.matches || []).map((m) => String(m.metadata?.content || ""));
        const squash = (s) => s.replace(/\s+/g, "");
        const joined = squash(ctx.join(" "));
        const answer = ctx.length ? await generateAnswer(probe.q, ctx) : "";

        results.push({
          site: site.id,
          variant: v.id,
          label: v.label,
          // the four fields DeepEval needs
          input: probe.q,
          actual_output: answer,
          retrieval_context: ctx,
          expected_output: probe.expected || null,
          // deterministic checks, no judge involved
          chunksIndexed: chunks.length,
          retrieved: ctx.length,
          factsExpected: probe.must.length,
          factsInContext: probe.must.filter((f) => joined.includes(squash(f))).length,
          factsInAnswer: probe.must.filter((f) => squash(answer).includes(squash(f))).length,
          missing: probe.must.filter((f) => !squash(answer).includes(squash(f))),
        });
      }
      fs.writeFileSync(path.join(OUT, "stage4.json"), JSON.stringify({ results, meter }, null, 2));
      console.log(`     spend so far $${meter.usd.toFixed(4)}`);
    }
  }

  // cleanup
  if (!DRY) {
    console.log("\ncleaning up test namespaces ...");
    for (const ns of namespaces) {
      try {
        await index.namespace(ns).deleteAll();
      } catch {}
    }
    console.log(`  ${namespaces.length} namespaces deleted`);
  }

  // report
  console.log("\n" + "=".repeat(78));
  console.log(
    "variant".padEnd(8) + "description".padEnd(30) + "inContext".padStart(11) + "inAnswer".padStart(11) + "chunks".padStart(9)
  );
  console.log("=".repeat(78));
  for (const v of VARIANTS) {
    const r = results.filter((x) => x.variant === v.id);
    if (!r.length) continue;
    const fe = r.reduce((a, b) => a + b.factsExpected, 0);
    const fc = r.reduce((a, b) => a + b.factsInContext, 0);
    const fa = r.reduce((a, b) => a + b.factsInAnswer, 0);
    const ch = r.reduce((a, b) => a + b.chunksIndexed, 0) / r.length;
    console.log(
      v.id.padEnd(8) + v.label.padEnd(30) + `${fc}/${fe}`.padStart(11) + `${fa}/${fe}`.padStart(11) + String(Math.round(ch)).padStart(9)
    );
  }
  console.log("=".repeat(78));
  console.log("deterministic only - DeepEval metrics come from 19-deepeval-score.py");
  console.log(`\nTOTAL SPEND  $${meter.usd.toFixed(6)}   (${meter.calls} API calls)`);
  for (const [m, b] of Object.entries(meter.byModel)) {
    console.log(`  ${m.padEnd(26)} ${b.calls} calls  ${b.inTok} in / ${b.outTok} out  $${b.usd.toFixed(6)}`);
  }
  console.log(`\n-> ${path.join(OUT, "stage4.json")}`);
})();
