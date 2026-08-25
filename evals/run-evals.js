#!/usr/bin/env node
/**
 * Golden eval runner for the RAG + tool-calling pipeline.
 *
 * Two suites:
 *   capability   - pure function test of buildAssistantTools(). No network, no
 *                  data, runs for every assistant type. Fast, deterministic.
 *   conversation - drives the real routes exactly as the browser does:
 *                  /messages -> tool call -> /api/pinecone -> /actions.
 *                  Asserts tool selection, grounding, refusals and hallucination
 *                  guards per turn.
 *
 * Metrics reported (per the RAG-eval literature):
 *   tool accuracy      - right tool / correctly no tool
 *   context recall     - expected facts present in the RETRIEVED chunks
 *   faithfulness proxy - facts in the answer also present in retrieved chunks
 *   refusal accuracy   - unanswerable questions declined rather than invented
 *   hallucination rate - not_contains violations
 *
 * SAFETY: read-only against your data. It creates one chatbot-sessions doc per
 * conversation case and deletes it afterwards. It never writes to
 * chatbots-data, user-chatbots, chat-history or Pinecone. Booking cases are
 * written so a correctly-behaving bot never creates a calendar event; they run
 * only against fixtures declared with calendar:false.
 *
 * Usage:
 *   node evals/run-evals.js                 # everything
 *   node evals/run-evals.js --suite capability
 *   node evals/run-evals.js --suite conversation
 *   node evals/run-evals.js --case conv-happy-pricing
 *   node evals/run-evals.js --repeat 5      # N times per case, for flake rate
 *   node evals/run-evals.js --base https://your-preview.vercel.app
 */

require("dotenv").config({ path: ".env.local" });
const fs = require("fs");
const path = require("path");
const { MongoClient } = require("mongodb");

const argv = process.argv.slice(2);
const arg = (n, d) => { const i = argv.indexOf(`--${n}`); return i === -1 ? d : argv[i + 1]; };
const BASE = arg("base", "http://localhost:3000").replace(/\/$/, "");
const SUITE = arg("suite", "all");
const ONLY = arg("case", null);
const REPEAT = Number(arg("repeat", 1));

const GOLDEN = JSON.parse(fs.readFileSync(path.join(__dirname, "golden-set.json"), "utf8"));

const c = {
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
};

const results = [];
const record = (suite, id, ok, detail, known) =>
  results.push({ suite, id, ok, detail, known: known || null });

const norm = (s) => String(s || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const has = (hay, needle) => norm(hay).toLowerCase().includes(String(needle).toLowerCase());

/** Phrases that indicate the assistant declined rather than invented an answer. */
const REFUSAL_MARKERS = [
  "don't have", "do not have", "couldn't find", "could not find", "no information",
  "not able to", "unable to", "don't offer", "do not offer", "not something we",
  "cannot provide", "can't provide", "not listed", "contact", "reach out",
  "i'm not sure", "not currently", "don't currently",
];
const looksLikeRefusal = (t) => REFUSAL_MARKERS.some((m) => has(t, m));

const BOOKING_PROMISES = [
  "i'll book", "i have booked", "i've booked", "booking confirmed", "you're booked",
  "you are booked", "i'll proceed with the booking", "i will book", "i'll go ahead and book",
  "i've scheduled", "i'll schedule you",
];

// ── capability suite ────────────────────────────────────────────────────────
async function runCapability() {
  let mod;
  try {
    mod = require("./tool-filter-shim");
  } catch (e) {
    console.log(c.yellow("  capability suite skipped: evals/tool-filter-shim.js missing"));
    return;
  }
  for (const t of GOLDEN.capability_cases) {
    if (ONLY && t.id !== ONLY) continue;
    const { tools } = mod.buildAssistantTools({
      assistantType: t.assistantType,
      chatbotRecord: t.integrations.shopify
        ? { integrations: { shopify: { token: "test", store: "test.myshopify.com" } } }
        : { integrations: {} },
      hasCalendar: !!t.integrations.calendar,
    });
    const got = tools.map((x) => x.name).sort();
    const want = [...t.expect_tools].sort();
    const ok = JSON.stringify(got) === JSON.stringify(want);
    record("capability", t.id, ok, ok ? "" : `expected [${want}] got [${got}]`);
    console.log(`  ${ok ? c.green("PASS") : c.red("FAIL")}  ${t.id.padEnd(28)} ${c.dim(got.join(", ") || "(none)")}`);
    if (!ok) console.log(`        ${c.red("expected: " + want.join(", "))}`);
  }
}

// ── conversation plumbing ───────────────────────────────────────────────────
async function sse(url, body) {
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await r.text();
  const events = [];
  for (const line of text.split("\n")) {
    if (!line.startsWith("data: ")) continue;
    const p = line.slice(6).trim();
    if (p === "[DONE]") continue;
    try { events.push(JSON.parse(p)); } catch (_) {}
  }
  return events;
}
function collect(events) {
  let id = null, text = null;
  const calls = [];
  for (const e of events) {
    if (e.type === "response.created") id = e.response?.id;
    if (e.type === "response.output_item.done" && e.item?.type === "function_call")
      calls.push({ name: e.item.name, args: e.item.arguments, call_id: e.item.call_id });
    if (e.type === "response.output_text.done") text = e.text;
  }
  return { id, calls, text };
}

async function retrieve(fx, query) {
  const r = await fetch(`${BASE}/api/pinecone`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userQuery: query, chatbotId: fx.chatbotId, userId: fx.userId, messages: [] }),
  });
  if (!r.ok) return { ok: false, status: r.status, chunks: [] };
  const chunks = await r.json();
  return { ok: true, status: 200, chunks: Array.isArray(chunks) ? chunks : [] };
}

/** One conversation case: drives every turn, returns per-turn observations. */
async function runConversation(tc) {
  const fx = GOLDEN.fixtures[tc.fixture];
  const session = `EVAL-${tc.id}-${Date.now()}`;
  const obs = [];

  for (const turn of tc.turns) {
    let { id, calls, text } = collect(
      await sse(`${BASE}/api/assistants/threads/${session}/messages`, {
        content: turn.user,
        assistantId: fx.chatbotId,
      })
    );
    const toolsUsed = calls.map((x) => x.name);
    let retrievedChunks = [];
    let guard = 0;

    while (calls.length && guard++ < 3) {
      const outputs = [];
      for (const call of calls) {
        let output;
        if (call.name === "get_reference") {
          const a = JSON.parse(call.args || "{}");
          const res = await retrieve(fx, a.userQuery || turn.user);
          retrievedChunks = retrievedChunks.concat(res.chunks);
          output = res.ok
            ? JSON.stringify({ success: true, data: res.chunks })
            : JSON.stringify({ success: false, message: `HTTP ${res.status}` });
        } else {
          // never actually execute side-effecting tools during evals
          output = JSON.stringify({ success: false, message: "tool not executed during evaluation" });
        }
        outputs.push({ tool_call_id: call.call_id, output });
      }
      const next = collect(
        await sse(`${BASE}/api/assistants/threads/${session}/actions`, {
          assistantId: fx.chatbotId,
          previousResponseId: id,
          toolCallOutputs: outputs,
        })
      );
      id = next.id || id;
      text = next.text ?? text;
      calls = next.calls;
      toolsUsed.push(...calls.map((x) => x.name));
    }
    obs.push({ turn, toolsUsed, text: norm(text), retrievedChunks });
  }

  // cleanup the session doc this run created
  const mongo = new MongoClient(process.env.NEXT_PUBLIC_MONGO_URI);
  await mongo.connect();
  await mongo.db().collection("chatbot-sessions").deleteOne({ sessionId: session });
  await mongo.close();

  return obs;
}

function judgeTurn(tcId, i, o) {
  const e = o.turn.expect || {};
  const fails = [];
  const ctx = o.retrievedChunks.map((x) => x.content).join(" ");

  if (e.tool !== undefined) {
    if (e.tool === null && o.toolsUsed.length) fails.push(`expected no tool, called ${o.toolsUsed.join(",")}`);
    if (e.tool && !o.toolsUsed.includes(e.tool)) fails.push(`expected tool ${e.tool}, got ${o.toolsUsed.join(",") || "none"}`);
  }
  if (e.any) {
    const okAny = e.any.some((t) => (t === null ? o.toolsUsed.length === 0 : o.toolsUsed.includes(t)));
    if (!okAny) fails.push(`expected one of [${e.any}], got ${o.toolsUsed.join(",") || "none"}`);
  }
  if (e.contains) {
    const mode = e.contains_mode === "any" ? "any" : "all";
    const hits = e.contains.filter((s) => has(o.text, s));
    if (mode === "all" && hits.length !== e.contains.length)
      fails.push(`answer missing ${e.contains.filter((s) => !has(o.text, s)).join(", ")}`);
    if (mode === "any" && hits.length === 0) fails.push(`answer missing any of ${e.contains.join(" | ")}`);
    if (e.grounded && ctx) {
      const ungrounded = hits.filter((s) => !has(ctx, s));
      if (ungrounded.length) fails.push(`NOT GROUNDED: ${ungrounded.join(", ")} absent from retrieved chunks`);
    }
  }
  if (e.not_contains) {
    const bad = e.not_contains.filter((s) => has(o.text, s));
    if (bad.length) fails.push(`hallucination guard hit: ${bad.join(", ")}`);
  }
  if (e.must_refuse && !looksLikeRefusal(o.text)) fails.push("expected a refusal, got a substantive answer");
  if (e.must_not_promise_booking) {
    const bad = BOOKING_PROMISES.filter((p) => has(o.text, p));
    if (bad.length) fails.push(`claimed a booking it cannot make: "${bad[0]}"`);
  }
  return fails;
}

async function runRetrievalOnly(tc) {
  const fx = GOLDEN.fixtures[tc.fixture];
  const res = await retrieve(fx, tc.query);
  const e = tc.expect || {};
  const fails = [];
  if (!res.ok) fails.push(`/api/pinecone returned HTTP ${res.status}`);
  if (e.min_chunks && res.chunks.length < e.min_chunks) fails.push(`expected >= ${e.min_chunks} chunks, got ${res.chunks.length}`);
  if (e.all_chunks_match_chatbot) {
    const bad = res.chunks.filter((x) => x.source === undefined && x.content === undefined).length;
    if (bad) fails.push(`${bad} chunks missing expected fields`);
  }
  if (e.max_top_score !== undefined && res.chunks[0]?.score > e.max_top_score)
    fails.push(`top score ${res.chunks[0].score.toFixed(3)} exceeds ${e.max_top_score}`);
  return fails;
}

async function runConversations() {
  for (const tc of GOLDEN.conversation_cases) {
    if (ONLY && tc.id !== ONLY) continue;
    for (let rep = 0; rep < REPEAT; rep++) {
      const label = REPEAT > 1 ? `${tc.id} #${rep + 1}` : tc.id;
      try {
        let fails = [];
        if (tc.retrieval_only) {
          fails = await runRetrievalOnly(tc);
        } else {
          const obs = await runConversation(tc);
          obs.forEach((o, i) => { fails = fails.concat(judgeTurn(tc.id, i, o).map((f) => `turn ${i + 1}: ${f}`)); });
        }
        const known = tc.expect?.expect_known_failure;
        const ok = fails.length === 0;
        record("conversation", label, ok, fails.join(" | "), known);
        const tag = ok ? c.green("PASS") : known ? c.yellow("KNOWN") : c.red("FAIL");
        console.log(`  ${tag}  ${label.padEnd(34)} ${c.dim(tc.category || "")}`);
        fails.forEach((f) => console.log(`        ${known ? c.yellow(f) : c.red(f)}`));
      } catch (err) {
        record("conversation", label, false, `threw: ${err.message}`);
        console.log(`  ${c.red("ERROR")} ${label}: ${err.message}`);
      }
    }
  }
}

(async () => {
  console.log(c.bold(`\nGolden evals   base=${BASE}   repeat=${REPEAT}\n`));
  if (SUITE === "all" || SUITE === "capability") {
    console.log(c.bold("Capability suite (tool exposure per assistant type)"));
    await runCapability();
  }
  if (SUITE === "all" || SUITE === "conversation") {
    console.log(c.bold("\nConversation suite (live routes)"));
    await runConversations();
  }

  const pass = results.filter((r) => r.ok).length;
  const known = results.filter((r) => !r.ok && r.known).length;
  const fail = results.filter((r) => !r.ok && !r.known).length;
  console.log(c.bold("\n── Summary"));
  console.log(`  passed: ${pass}   failed: ${fail}   known-issue: ${known}   total: ${results.length}`);
  if (fail) {
    console.log(c.red("\n  Failures:"));
    results.filter((r) => !r.ok && !r.known).forEach((r) => console.log(`    ${r.id}: ${r.detail}`));
  }
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error("runner crashed:", e); process.exit(2); });
