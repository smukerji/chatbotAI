#!/usr/bin/env node
/**
 * Playwright UI eval runner.
 *
 * Drives the real dashboard chat for existing chatbots, so every conversation
 * is written to `chat-history` and is reviewable afterwards in Compass:
 *     db.getCollection("chat-history").findOne({ chatbotId: "<id>" })
 *     -> chats.<sessionId>.messages
 *
 * Per turn it captures:
 *   - the answer rendered in the UI
 *   - every /api/* request the browser made (method, status, ms)
 *   - the exact slice of server log produced by that turn, parsed for
 *     tools / tools_dropped / [ToolDecision] / [rag ...] / [ToolResult]
 *   - a screenshot
 *
 * Nothing is created or deleted. It reuses existing bots and only appends
 * conversations, exactly as a human tester would.
 *
 *   node evals/ui-runner.js                        # all scenarios
 *   node evals/ui-runner.js --scenario S01-floatco-mixed
 *   node evals/ui-runner.js --bot floatco
 *   node evals/ui-runner.js --headed               # watch it
 */
require("dotenv").config({ path: ".env.local" });
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const BASE = process.env.EVAL_BASE || "http://localhost:3000";
const ROOT = __dirname;
const STATE = path.join(ROOT, ".auth", "state.json");
const ART = path.join(ROOT, "artifacts");
const SERVER_LOG = path.join(ART, "server.log");
const RUN_ID = new Date().toISOString().replace(/[:.]/g, "-");
const RUN_DIR = path.join(ART, `run-${RUN_ID}`);

const argv = process.argv.slice(2);
const arg = (n, d) => { const i = argv.indexOf(`--${n}`); return i === -1 ? d : argv[i + 1]; };
const ONLY_SC = arg("scenario", null);
const ONLY_BOT = arg("bot", null);
const HEADED = argv.includes("--headed");
const TURN_TIMEOUT = Number(arg("turn-timeout", 120000));

const G = JSON.parse(fs.readFileSync(path.join(ROOT, "ui-scenarios.json"), "utf8"));

const norm = (s) => String(s || "").replace(/\s+/g, " ").trim();
const has = (h, n) => norm(h).toLowerCase().includes(String(n).toLowerCase());
const stripAnsi = (s) => s.replace(/\x1b\[[0-9;]*m/g, "");

/**
 * Phrases that mean "I am not answering this from my own knowledge".
 * Extended after the 2026-08-20 run: the assistant refused correctly with
 * "recommend reaching out to the business directly" / "at the discretion of the
 * business", which the original list missed and scored as a false failure.
 */
const REFUSAL = ["don't have", "do not have", "couldn't find", "could not find", "no information",
  "not able to", "unable to", "don't offer", "do not offer", "not something", "cannot provide",
  "can't provide", "not listed", "contact", "reach out", "i'm not sure", "don't currently",
  "not currently", "no details", "doesn't appear", "does not appear", "not related", "outside",
  "recommend reaching", "at the discretion", "directly for", "check the business",
  "visit the business", "i can't confirm", "cannot confirm", "not part of", "not something i",
  "i'm here to help with", "i can only", "specialise in", "specialize in",
  "i'm here to assist", "here to assist with", "look up that", "related to our business",
  "related to a specific business", "recommend checking", "i can't assist",
  "still learning", "hope to get back", "questions specifically about"];
const BOOKING_PROMISE = ["i'll book", "i have booked", "i've booked", "booking confirmed",
  "you're booked", "you are booked", "i'll proceed with the booking", "i will book",
  "i've scheduled", "i'll schedule you", "your booking is"];

const looksRefusal = (t) => REFUSAL.some((m) => has(t, m));

function parseServerSlice(slice) {
  const lines = stripAnsi(slice).split("\n");
  const out = { toolsOffered: null, toolsDropped: null, toolDecision: null, toolResult: null, rag: [], errors: [] };
  for (const l of lines) {
    if (l.startsWith("tools          :") || l.startsWith("tools             :")) out.toolsOffered = l.split(":").slice(1).join(":").trim();
    if (l.includes("tools_dropped")) out.toolsDropped = l.split(":").slice(1).join(":").trim();
    if (l.includes("[ToolDecision]")) out.toolDecision = l.trim();
    if (l.includes("[ToolResult]")) out.toolResult = l.trim();
    if (l.includes("[rag ")) out.rag.push(l.trim());
    if (/\berror\b/i.test(l) && !l.includes("[ToolDecision]")) out.errors.push(l.trim().slice(0, 200));
  }
  const m = out.toolDecision && out.toolDecision.match(/functions_called:\s*([^|]+)/);
  out.functionsCalled = m ? m[1].trim() : null;
  const r = out.toolDecision && out.toolDecision.match(/retrieval_used:\s*(\w+)/);
  out.retrievalUsed = r ? r[1] === "true" : null;
  return out;
}

function judge(expect, answer, server) {
  const fails = [];
  const called = (server.functionsCalled || "").toLowerCase();
  const noTool = !called || called === "none";

  /// An empty answer used to PASS any not_contains/must_refuse assertion, because
  /// there was nothing to violate. One turn that produced no answer at all (the
  /// request died on ECONNRESET) was scored green. Treat it as a failure.
  if (!norm(answer)) {
    fails.push("EMPTY ANSWER - no assistant message rendered for this turn");
    return fails;
  }

  if (expect.tool !== undefined) {
    if (expect.tool === null && !noTool) fails.push(`expected NO tool, called ${called}`);
    if (expect.tool && !called.includes(expect.tool.toLowerCase())) fails.push(`expected ${expect.tool}, called ${called || "none"}`);
  }
  if (expect.any) {
    const ok = expect.any.some((t) => (t === null ? noTool : called.includes(String(t).toLowerCase())));
    if (!ok) fails.push(`expected one of [${expect.any}], called ${called || "none"}`);
  }
  if (expect.contains) {
    const hits = expect.contains.filter((s) => has(answer, s));
    if (expect.contains_mode === "any") {
      if (!hits.length) fails.push(`answer contains none of: ${expect.contains.join(" | ")}`);
    } else if (hits.length !== expect.contains.length) {
      fails.push(`answer missing: ${expect.contains.filter((s) => !has(answer, s)).join(", ")}`);
    }
  }
  if (expect.not_contains) {
    const bad = expect.not_contains.filter((s) => has(answer, s));
    if (bad.length) fails.push(`GUARD HIT: answer contains ${bad.join(", ")}`);
  }
  if (expect.must_refuse && !looksRefusal(answer)) fails.push("expected a refusal, got a substantive answer");
  if (expect.must_not_promise_booking) {
    const bad = BOOKING_PROMISE.filter((p) => has(answer, p));
    if (bad.length) fails.push(`FALSE BOOKING CLAIM: "${bad[0]}"`);
  }
  if (expect.grounded === true && expect.contains) {
    if (server.retrievalUsed === false) fails.push("grounding unverifiable: retrieval_used=false (answer came from model knowledge)");
  }
  return fails;
}

/**
 * The chat input is disabled while the assistant is generating, which is a far
 * more reliable completion signal than watching the text stop changing.
 */
function chatInput(page) {
  return page.locator('input[placeholder*="message" i], textarea[placeholder*="message" i], input[type="text"]').last();
}

async function waitForInputEnabled(page, timeout) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const el = chatInput(page);
    if ((await el.count()) && !(await el.isDisabled().catch(() => true))) return true;
    await page.waitForTimeout(1000);
  }
  return false;
}

async function sendTurn(page, text) {
  if (!(await waitForInputEnabled(page, 60000))) throw new Error("chat input never became enabled");
  const input = chatInput(page);
  await input.click();
  await input.fill(text);
  await page.keyboard.press("Enter");
}

/**
 * Reads the LAST assistant bubble. Diffing whole-page text by length looked
 * simpler but silently corrupts the answer whenever the page re-renders — one
 * turn was recorded as the single word "warming" when the bot had actually
 * produced a full three-sentence refusal.
 */
async function lastAssistantMessage(page) {
  const bubbles = page.locator(".assistant-message");
  const n = await bubbles.count().catch(() => 0);
  if (!n) return "";
  return norm(await bubbles.nth(n - 1).innerText().catch(() => ""));
}

async function readAnswer(page, beforeCount) {
  // 1) input goes disabled  = generation started
  const t0 = Date.now();
  while (Date.now() - t0 < 20000) {
    if (await chatInput(page).isDisabled().catch(() => false)) break;
    await page.waitForTimeout(500);
  }
  // 2) input re-enabled = generation finished
  await waitForInputEnabled(page, TURN_TIMEOUT);
  // 3) let the last streamed tokens paint
  await page.waitForTimeout(2500);
  return await lastAssistantMessage(page);
}

(async () => {
  if (!fs.existsSync(STATE)) { console.log("no auth state — run: node evals/login-check.js"); process.exit(1); }
  fs.mkdirSync(RUN_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: !HEADED });
  const ctx = await browser.newContext({ storageState: STATE, viewport: { width: 1440, height: 950 } });
  const report = [];

  for (const sc of G.scenarios) {
    if (ONLY_SC && sc.id !== ONLY_SC) continue;
    if (ONLY_BOT && sc.bot !== ONLY_BOT) continue;
    const bot = G.bots[sc.bot];
    console.log(`\n=== ${sc.id}  [${bot.name} / ${bot.assistantType}]`);

    const page = await ctx.newPage();
    const net = [];
    page.on("response", async (res) => {
      const u = res.url();
      if (!u.includes("/api/") && !u.includes("/actions") && !u.includes("/messages")) return;
      net.push({ t: Date.now(), url: u.replace(BASE, ""), method: res.request().method(), status: res.status() });
    });

    const param = encodeURIComponent(JSON.stringify({
      id: bot.id, name: bot.name, botType: bot.botType, assistantType: bot.assistantType,
    }));
    /// The UI creates the session with POST /api/assistants/threads on mount and
    /// only then has a threadId. Sending before that produces
    /// POST /api/assistants/threads//messages -> 308 -> 404, and the UI hangs on
    /// the typing indicator with no error shown. Wait for the session first.
    const threadCreated = page
      .waitForResponse(
        (r) => r.url().includes("/api/assistants/threads") && r.request().method() === "POST" && r.status() < 400,
        { timeout: 90000 }
      )
      .catch(() => null);
    await page.goto(`${BASE}/chatbot/dashboard?chatbot=${param}`, { waitUntil: "domcontentloaded", timeout: 90000 });
    const threadRes = await threadCreated;
    console.log(`  session created: ${threadRes ? "yes" : "NO (will likely 404)"}`);
    await page.waitForTimeout(6000);
    await page.screenshot({ path: path.join(RUN_DIR, `${sc.id}-00-loaded.png`) });

    const scResult = { id: sc.id, bot: bot.name, botId: bot.id, assistantType: bot.assistantType,
      category: sc.category, why: sc.why, turns: [] };

    for (let i = 0; i < sc.turns.length; i++) {
      const turn = sc.turns[i];
      const logBefore = fs.existsSync(SERVER_LOG) ? fs.statSync(SERVER_LOG).size : 0;
      const netBefore = net.length;
      const bodyBefore = (await page.locator("body").innerText().catch(() => "")).length;
      const t0 = Date.now();

      try { await sendTurn(page, turn.user); }
      catch (e) {
        scResult.turns.push({ n: i + 1, user: turn.user, error: `could not send: ${e.message}` });
        break;
      }

      const answerText = await readAnswer(page, bodyBefore);
      const ms = Date.now() - t0;

      // server log slice for exactly this turn
      let slice = "";
      try {
        const fd = fs.openSync(SERVER_LOG, "r");
        const size = fs.statSync(SERVER_LOG).size;
        const len = Math.max(0, size - logBefore);
        if (len > 0) { const buf = Buffer.alloc(len); fs.readSync(fd, buf, 0, len, logBefore); slice = buf.toString("utf8"); }
        fs.closeSync(fd);
      } catch (_) {}
      const server = parseServerSlice(slice);

      const answer = norm(answerText).slice(0, 1500);

      const fails = judge(turn.expect || {}, answer, server);
      const shot = `${sc.id}-${String(i + 1).padStart(2, "0")}.png`;
      await page.screenshot({ path: path.join(RUN_DIR, shot) });

      scResult.turns.push({
        n: i + 1, user: turn.user, expect: turn.expect, answer, ms,
        toolsOffered: server.toolsOffered, toolsDropped: server.toolsDropped,
        functionsCalled: server.functionsCalled, retrievalUsed: server.retrievalUsed,
        ragLines: server.rag, toolResult: server.toolResult,
        serverErrors: server.errors.slice(0, 5),
        network: net.slice(netBefore).map((n) => `${n.method} ${n.url} ${n.status}`),
        screenshot: shot, pass: fails.length === 0, fails,
      });

      console.log(`  turn ${i + 1} ${fails.length ? "FAIL" : "pass"}  tool=${server.functionsCalled || "none"} retr=${server.retrievalUsed} ${ms}ms`);
      fails.forEach((f) => console.log(`        ${f}`));
    }

    report.push(scResult);
    await page.close();
    fs.writeFileSync(path.join(RUN_DIR, "raw-report.json"), JSON.stringify(report, null, 2));
  }

  await browser.close();
  fs.writeFileSync(path.join(RUN_DIR, "raw-report.json"), JSON.stringify(report, null, 2));
  require("./write-report.js")(report, RUN_DIR, RUN_ID);
  const total = report.reduce((n, s) => n + s.turns.length, 0);
  const failed = report.reduce((n, s) => n + s.turns.filter((t) => !t.pass).length, 0);
  console.log(`\nturns: ${total}  failed: ${failed}`);
  console.log(`report: ${path.join(RUN_DIR, "ANALYSIS.md")}`);
})().catch((e) => { console.error("runner crashed:", e); process.exit(2); });
