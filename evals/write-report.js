/**
 * Renders the detailed per-test-case analysis from a run.
 * Called by ui-runner.js; produces ANALYSIS.md next to the raw JSON.
 */
const fs = require("fs");
const path = require("path");

module.exports = function writeReport(report, runDir, runId) {
  const L = [];
  const totalTurns = report.reduce((n, s) => n + s.turns.length, 0);
  const failedTurns = report.reduce((n, s) => n + s.turns.filter((t) => !t.pass).length, 0);

  L.push(`# UI Eval Run — Detailed Analysis`);
  L.push(``);
  L.push(`**Run:** ${runId}`);
  L.push(`**Target:** ${process.env.EVAL_BASE || "http://localhost:3000"} (local dev)`);
  L.push(`**Scenarios:** ${report.length}  **Turns:** ${totalTurns}  **Failed turns:** ${failedTurns}`);
  L.push(``);
  L.push(`Driven through the real dashboard UI with Playwright, so every conversation`);
  L.push(`is persisted. To review any conversation yourself:`);
  L.push(``);
  L.push("```js");
  L.push(`db.getCollection("chat-history").findOne({ chatbotId: "<botId below>" })`);
  L.push(`// then expand chats.<sessionId>.messages`);
  L.push("```");
  L.push(``);
  L.push(`Screenshots and the raw JSON transcript are in \`${path.basename(runDir)}/\`.`);
  L.push(``);

  // ── summary table ─────────────────────────────────────────────────────────
  L.push(`## Summary`);
  L.push(``);
  L.push(`| Scenario | Bot | Type | Turns | Failed |`);
  L.push(`|---|---|---|---:|---:|`);
  for (const s of report) {
    const f = s.turns.filter((t) => !t.pass).length;
    L.push(`| ${s.id} | ${s.bot} | \`${s.assistantType}\` | ${s.turns.length} | ${f ? `**${f}**` : "0"} |`);
  }
  L.push(``);

  // ── failures first ────────────────────────────────────────────────────────
  const allFails = [];
  report.forEach((s) => s.turns.filter((t) => !t.pass || t.error).forEach((t) => allFails.push({ s, t })));
  if (allFails.length) {
    L.push(`## Failures`);
    L.push(``);
    for (const { s, t } of allFails) {
      L.push(`### ${s.id} turn ${t.n} — ${s.bot}`);
      L.push(``);
      L.push(`**Asked:** \`${t.user}\``);
      L.push(``);
      (t.fails || [t.error || 'turn did not complete']).forEach((f) => L.push(`- ${f}`));
      L.push(``);
      L.push(`| | |`);
      L.push(`|---|---|`);
      L.push(`| tools offered | ${t.toolsOffered || "(not logged)"} |`);
      L.push(`| tools dropped | ${t.toolsDropped || "(none)"} |`);
      L.push(`| functions called | ${t.functionsCalled || "none"} |`);
      L.push(`| retrieval_used | ${t.retrievalUsed} |`);
      L.push(`| latency | ${t.ms}ms |`);
      L.push(``);
      L.push(`**Answer:**`);
      L.push(``);
      L.push(`> ${(t.answer || "(empty)").slice(0, 700)}`);
      L.push(``);
      if (t.ragLines?.length) {
        L.push(`**RAG trace:**`);
        L.push("```");
        t.ragLines.slice(0, 12).forEach((r) => L.push(r));
        L.push("```");
      }
      if (t.serverErrors?.length) {
        L.push(`**Server errors during this turn:**`);
        L.push("```");
        t.serverErrors.forEach((e) => L.push(e));
        L.push("```");
      }
      L.push(`**Screenshot:** \`${t.screenshot}\``);
      L.push(``);
    }
  } else {
    L.push(`## Failures`);
    L.push(``);
    L.push(`None.`);
    L.push(``);
  }

  // ── full detail ───────────────────────────────────────────────────────────
  L.push(`## Full transcript, per scenario`);
  L.push(``);
  for (const s of report) {
    L.push(`### ${s.id} — ${s.bot}`);
    L.push(``);
    L.push(`- **chatbotId:** \`${s.botId}\``);
    L.push(`- **assistantType:** \`${s.assistantType}\``);
    L.push(`- **categories:** ${s.category}`);
    L.push(`- **why this scenario:** ${s.why}`);
    L.push(``);
    for (const t of s.turns) {
      if (t.error) { L.push(`**Turn ${t.n}** — ERROR: ${t.error}`); L.push(``); continue; }
      L.push(`#### Turn ${t.n} ${t.pass ? "✅" : "❌"} — \`${t.user}\``);
      L.push(``);
      L.push(`**Expected:** \`${JSON.stringify(t.expect || {})}\``);
      L.push(``);
      L.push(`**Answer:** ${(t.answer || "(empty)").slice(0, 600)}`);
      L.push(``);
      L.push(`| tools offered | tools dropped | called | retrieval | latency |`);
      L.push(`|---|---|---|---|---|`);
      L.push(`| ${t.toolsOffered || "-"} | ${t.toolsDropped || "-"} | ${t.functionsCalled || "none"} | ${t.retrievalUsed} | ${t.ms}ms |`);
      L.push(``);
      if (t.ragLines?.length) {
        L.push(`<details><summary>RAG phase trace</summary>`);
        L.push(``);
        L.push("```");
        t.ragLines.forEach((r) => L.push(r));
        L.push("```");
        L.push(`</details>`);
        L.push(``);
      }
      if (t.network?.length) {
        L.push(`<details><summary>Network (${t.network.length})</summary>`);
        L.push(``);
        L.push("```");
        t.network.forEach((n) => L.push(n));
        L.push("```");
        L.push(`</details>`);
        L.push(``);
      }
      if (!t.pass) { L.push(`**Failures:**`); t.fails.forEach((f) => L.push(`- ${f}`)); L.push(``); }
      L.push(`Screenshot: \`${t.screenshot}\``);
      L.push(``);
    }
  }

  const out = path.join(runDir, "ANALYSIS.md");
  fs.writeFileSync(out, L.join("\n"));
  return out;
};
