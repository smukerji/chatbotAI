/**
 * Stage 4 preflight. Verifies every dependency before any spend, and proves the
 * cost meter works by pricing one real embedding call.
 *
 * Read-only apart from a single test vector written to an isolated namespace
 * and deleted immediately, which is the only way to confirm write access
 * without discovering a problem mid-run.
 *
 *   node evals-crawler/16-preflight.js
 */

const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });

const { Pinecone } = require("@pinecone-database/pinecone");
const { OpenAI } = require("openai");
const { execSync } = require("child_process");

// published rates, used for every cost figure in this run
const RATES = {
  "text-embedding-ada-002": { in: 0.10 / 1e6, out: 0 },
  "gpt-4.1-mini": { in: 0.40 / 1e6, out: 1.60 / 1e6 },
};

const TEST_NS = "evalstage4-sandbox";
const ok = (m) => console.log(`  PASS  ${m}`);
const bad = (m) => {
  console.log(`  FAIL  ${m}`);
  process.exitCode = 1;
};

(async () => {
  console.log("Stage 4 preflight\n");
  let cost = 0;

  // ── 1. credentials present ────────────────────────────────────────────────
  console.log("1. credentials");
  const openaiKey = (process.env.NEXT_PUBLIC_OPENAI_KEY || "").trim();
  const pineKey = (process.env.NEXT_PUBLIC_PINECONE_KEY || "").trim();
  const pineIdx = (process.env.NEXT_PUBLIC_PINECONE_INDEX || "").trim();
  const mongo = (process.env.NEXT_PUBLIC_MONGO_URI || "").trim();
  openaiKey ? ok(`OPENAI key present (${openaiKey.length} chars)`) : bad("OPENAI key missing");
  pineKey ? ok(`PINECONE key present (${pineKey.length} chars)`) : bad("PINECONE key missing");
  pineIdx ? ok(`PINECONE index = ${pineIdx}`) : bad("PINECONE index missing");
  mongo ? ok("MONGO uri present") : bad("MONGO uri missing");
  // the trailing-newline bug that caused the 500s earlier
  const raw = process.env.NEXT_PUBLIC_OPENAI_KEY || "";
  raw === raw.trim() ? ok("OPENAI key has no stray whitespace") : bad("OPENAI key has leading/trailing whitespace");

  // ── 2. OpenAI reachable, and the cost meter works ─────────────────────────
  console.log("\n2. OpenAI");
  const openai = new OpenAI({ apiKey: openaiKey });
  try {
    const r = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: "preflight probe for stage 4 cost metering",
    });
    const tok = r.usage.total_tokens;
    const c = tok * RATES["text-embedding-ada-002"].in;
    cost += c;
    ok(`embeddings OK - dim ${r.data[0].embedding.length}, ${tok} tokens, $${c.toFixed(8)}`);
  } catch (e) {
    bad(`embeddings: ${String(e.message).slice(0, 120)}`);
  }

  try {
    const r = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [{ role: "user", content: "reply with the single word: ready" }],
      temperature: 0,
      max_tokens: 5,
    });
    const u = r.usage;
    const c = u.prompt_tokens * RATES["gpt-4.1-mini"].in + u.completion_tokens * RATES["gpt-4.1-mini"].out;
    cost += c;
    ok(`judge model OK - "${r.choices[0].message.content.trim()}", ${u.total_tokens} tokens, $${c.toFixed(8)}`);
  } catch (e) {
    bad(`judge model: ${String(e.message).slice(0, 120)}`);
  }

  // ── 3. Pinecone: index shape and namespace isolation ──────────────────────
  console.log("\n3. Pinecone");
  try {
    const pc = new Pinecone({ apiKey: pineKey });
    const index = pc.index(pineIdx);
    const stats = await index.describeIndexStats();
    ok(`index reachable - dimension ${stats.dimension}, ${stats.totalRecordCount} vectors`);

    const namespaces = Object.keys(stats.namespaces || {});
    ok(`${namespaces.length} existing namespaces`);
    namespaces.includes(TEST_NS)
      ? bad(`test namespace "${TEST_NS}" ALREADY EXISTS - pick another`)
      : ok(`test namespace "${TEST_NS}" is free - no collision with customer data`);

    // write one vector, read it back, delete it
    const vec = new Array(stats.dimension).fill(0).map(() => Math.random() * 0.01);
    await index.namespace(TEST_NS).upsert([{ id: "preflight", values: vec, metadata: { probe: true } }]);
    await new Promise((r) => setTimeout(r, 3000));
    const back = await index.namespace(TEST_NS).fetch(["preflight"]);
    back.records?.preflight ? ok("write + read back OK") : bad("wrote a vector but could not read it back");

    await index.namespace(TEST_NS).deleteAll();
    ok("test namespace deleted - nothing left behind");
  } catch (e) {
    bad(`pinecone: ${String(e.message).slice(0, 160)}`);
  }

  // ── 4. Python side for DeepEval scoring ───────────────────────────────────
  console.log("\n4. DeepEval");
  const venv = path.join(__dirname, "..", "evals-deepeval", ".venv", "Scripts", "python.exe");
  if (!fs.existsSync(venv)) {
    bad(`venv not found at ${venv}`);
  } else {
    try {
      const v = execSync(`"${venv}" -c "import deepeval,sys;print(deepeval.__version__)"`, {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      }).trim();
      ok(`deepeval ${v} importable`);
    } catch (e) {
      bad(`deepeval import failed: ${String(e.message).slice(0, 120)}`);
    }
  }

  // ── 5. crawl + extract deps ───────────────────────────────────────────────
  console.log("\n5. pipeline deps");
  for (const m of ["crawlee", "playwright", "turndown", "turndown-plugin-gfm", "node-html-parser"]) {
    try {
      require.resolve(m);
      ok(m);
    } catch {
      bad(`${m} not installed`);
    }
  }

  console.log("\n" + "=".repeat(52));
  console.log(`preflight spend: $${cost.toFixed(8)}`);
  console.log(process.exitCode ? "RESULT: FAILURES ABOVE - do not run stage 4" : "RESULT: all checks passed");
  console.log("=".repeat(52));
})();
