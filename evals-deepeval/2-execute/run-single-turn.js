#!/usr/bin/env node
/**
 * Stage 2a - run the single-turn goldens through the REAL app.
 *
 * This is not DeepEval. DeepEval scores outputs; it does not run your
 * application. Every field below comes from an actual HTTP call to the running
 * app, exactly as the browser makes them:
 *
 *   POST /api/assistants/threads/<session>/messages   -> model decides on a tool
 *   POST /api/pinecone                                -> the retrieval the app itself asked for
 *   POST /api/assistants/threads/<session>/actions    -> final answer
 *
 * Records per golden:
 *   actual_output     - what the assistant really said
 *   retrieval_context - the chunks the app really retrieved
 *   tools_called      - the functions the model really invoked
 *
 * Nothing is synthesised here, and a failed call is recorded as a failure
 * rather than skipped.
 *
 *   node evals-deepeval/2-execute/run-single-turn.js [--limit N] [--bot key]
 */
require("dotenv").config({ path: ".env.local" });
const fs = require("fs");
const path = require("path");
const { MongoClient } = require("mongodb");

const BASE = process.env.EVAL_BASE || "http://localhost:3000";
const ROOT = path.resolve(__dirname, "..");
const USER_ID = "65d2f2c1e41b6e876c267350";

const argv = process.argv.slice(2);
const arg = (n, d) => { const i = argv.indexOf(`--${n}`); return i === -1 ? d : argv[i + 1]; };
const LIMIT = Number(arg("limit", 0));
const ONLY_BOT = arg("bot", null);

const goldens = JSON.parse(fs.readFileSync(path.join(ROOT, "goldens", "single-turn.json"), "utf8"));

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
  return { status: r.status, events };
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

(async () => {
  const list = goldens
    .filter((g) => !ONLY_BOT || g.bot === ONLY_BOT)
    .slice(0, LIMIT || undefined);

  console.log(`executing ${list.length} single-turn goldens against ${BASE}\n`);
  const out = [];
  const sessions = [];

  for (let i = 0; i < list.length; i++) {
    const g = list[i];
    const session = `DEVAL-${Date.now()}-${i}`;
    sessions.push(session);
    const started = Date.now();
    const record = {
      ...g,
      session,
      actual_output: null,
      retrieval_context: [],
      tools_called: [],
      retrieval_scores: [],
      error: null,
      ms: 0,
    };

    try {
      let { status, events } = await sse(
        `${BASE}/api/assistants/threads/${session}/messages`,
        { content: g.input, assistantId: g.chatbot_id }
      );
      if (status !== 200) throw new Error(`/messages HTTP ${status}`);
      let { id, calls, text } = collect(events);
      record.tools_called.push(...calls.map((c) => c.name));

      let guard = 0;
      while (calls.length && guard++ < 3) {
        const outputs = [];
        for (const call of calls) {
          let output;
          if (call.name === "get_reference") {
            const a = JSON.parse(call.args || "{}");
            const r = await fetch(`${BASE}/api/pinecone`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userQuery: a.userQuery || g.input,
                chatbotId: g.chatbot_id,
                userId: USER_ID,
                messages: [],
              }),
            });
            if (r.ok) {
              const chunks = await r.json();
              const arr = Array.isArray(chunks) ? chunks : [];
              // the retrieval the APP performed - this is what faithfulness and
              // the contextual metrics will be judged against
              record.retrieval_context.push(...arr.map((c) => String(c.content || "")));
              record.retrieval_scores.push(...arr.map((c) => c.score));
              output = JSON.stringify({ success: true, data: arr });
            } else {
              output = JSON.stringify({ success: false, message: `HTTP ${r.status}` });
              record.error = `pinecone HTTP ${r.status}`;
            }
          } else {
            /// side-effecting tools are not executed during evaluation
            output = JSON.stringify({ success: false, message: "tool not executed during evaluation" });
          }
          outputs.push({ tool_call_id: call.call_id, output });
        }
        const next = collect(
          (await sse(`${BASE}/api/assistants/threads/${session}/actions`, {
            assistantId: g.chatbot_id,
            previousResponseId: id,
            toolCallOutputs: outputs,
          })).events
        );
        id = next.id || id;
        text = next.text ?? text;
        calls = next.calls;
        record.tools_called.push(...calls.map((c) => c.name));
      }
      record.actual_output = text;
      if (!text) record.error = record.error || "no answer produced";
    } catch (e) {
      record.error = e.message;
    }
    record.ms = Date.now() - started;

    const tag = record.error ? "ERROR" : "ok   ";
    console.log(
      `[${String(i + 1).padStart(2)}/${list.length}] ${tag} ${g.bot.padEnd(10)} ` +
      `tools=${record.tools_called.join(",") || "none"} ` +
      `chunks=${record.retrieval_context.length} ${record.ms}ms`
    );
    if (record.error) console.log(`         ${record.error}`);
    out.push(record);
    fs.writeFileSync(path.join(ROOT, "results", "single-turn-executed.json"), JSON.stringify(out, null, 2));
  }

  // remove the session docs this run created
  const mongo = new MongoClient(process.env.NEXT_PUBLIC_MONGO_URI);
  await mongo.connect();
  const del = await mongo.db().collection("chatbot-sessions").deleteMany({ sessionId: { $in: sessions } });
  await mongo.close();

  const ok = out.filter((r) => !r.error).length;
  const withCtx = out.filter((r) => r.retrieval_context.length).length;
  console.log(`\nexecuted: ${out.length}   succeeded: ${ok}   with retrieval context: ${withCtx}`);
  console.log(`cleaned ${del.deletedCount} test session docs`);
  console.log(`-> evals-deepeval/results/single-turn-executed.json`);
})().catch((e) => { console.error("executor crashed:", e); process.exit(1); });
