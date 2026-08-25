/**
 * Aggregates broad-bakeoff.json. Reports overall standings and then breaks them
 * down by the corpus dimensions, because an extractor that wins on articles can
 * still lose on pricing pages - which is the case we care about.
 *
 *   node evals-crawler/10-analyze.js
 */

const fs = require("fs");
const path = require("path");

const OUT = path.join(__dirname, "results");
const rows = JSON.parse(fs.readFileSync(path.join(OUT, "broad-bakeoff.json"), "utf8"));

const EXTRACTORS = ["production", "turndown", "readability", "defuddle"];
const pct = (v) => (v === null || v === undefined || Number.isNaN(v) ? "  -  " : (v * 100).toFixed(1).padStart(5));
const num = (v, d = 1) => (v === null || v === undefined || Number.isNaN(v) ? "  -  " : v.toFixed(d).padStart(5));

const mean = (arr) => {
  const v = arr.filter((x) => x !== null && x !== undefined && !Number.isNaN(x));
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
};

function agg(subset) {
  const out = {};
  for (const ex of EXTRACTORS) {
    const r = subset.filter((x) => x.extractor === ex && !x.error);
    const errs = subset.filter((x) => x.extractor === ex && x.error).length;
    out[ex] = {
      n: r.length,
      errors: errs,
      recall: mean(r.map((x) => x.recall)),
      numbers: mean(r.map((x) => x.numbersKept)),
      boiler: mean(r.map((x) => x.boilerShare)),
      glued: mean(r.map((x) => x.gluedPer1k)),
      midWord: mean(r.map((x) => x.midWordPct)),
      imageChars: mean(r.map((x) => x.imageChars)),
      headings: mean(r.map((x) => x.headings)),
      mdTables: mean(r.map((x) => x.mdTables)),
      chars: mean(r.map((x) => x.chars)),
    };
  }
  return out;
}

function table(title, subset) {
  const a = agg(subset);
  const pages = new Set(subset.map((r) => r.url)).size;
  console.log(`\n${title}   (${pages} pages)`);
  console.log(
    "  " + "extractor".padEnd(13) + "recall".padStart(7) + "nums".padStart(7) + "boiler".padStart(8) +
    "glued".padStart(7) + "midWd".padStart(7) + "imgCh".padStart(7) + "head".padStart(6) + "tbl".padStart(5) + "err".padStart(5)
  );
  console.log("  " + "-".repeat(77));
  for (const ex of EXTRACTORS) {
    const s = a[ex];
    if (!s.n && !s.errors) continue;
    console.log(
      // midWord is stored already as a percentage, so it must not go through pct()
      "  " + ex.padEnd(13) + pct(s.recall) + "%" + pct(s.numbers) + "%" + pct(s.boiler) + "%" +
      num(s.glued) + " " + num(s.midWord) + "%" + String(Math.round(s.imageChars ?? 0)).padStart(7) +
      String(Math.round(s.headings ?? 0)).padStart(6) + String(Math.round(s.mdTables ?? 0)).padStart(5) +
      String(s.errors).padStart(5)
    );
  }
}

console.log("=".repeat(82));
console.log("recall = content kept   nums = currency/number tokens kept   boiler = repeated across site");
console.log("glued = glued words per 1k chars   midWd = chunks starting mid-word   lower is better on the last four");
console.log("=".repeat(82));

table("OVERALL", rows);

const by = (key) => [...new Set(rows.map((r) => r[key]).filter(Boolean))].sort();

for (const dim of ["type", "rendering", "tables", "stack"]) {
  console.log("\n" + "=".repeat(82));
  console.log(`BY ${dim.toUpperCase()}`);
  console.log("=".repeat(82));
  for (const v of by(dim)) table(`${dim} = ${v}`, rows.filter((r) => r[dim] === v));
}

// per-site winner on recall
console.log("\n" + "=".repeat(82));
console.log("PER SITE - best recall, and whether numbers survived");
console.log("=".repeat(82));
console.log("site".padEnd(16) + "type".padEnd(22) + "winner".padEnd(14) + "recall".padStart(7) + "  numbers by extractor");
console.log("-".repeat(82));
for (const site of by("site")) {
  const sub = rows.filter((r) => r.site === site && !r.error);
  if (!sub.length) continue;
  const a = agg(sub);
  const ranked = EXTRACTORS.filter((e) => a[e].recall !== null).sort((x, y) => a[y].recall - a[x].recall);
  const w = ranked[0];
  const nums = EXTRACTORS.map((e) => `${e[0]}:${a[e].numbers === null ? "-" : Math.round(a[e].numbers * 100)}`).join(" ");
  console.log(
    site.padEnd(16) + String(sub[0].type).padEnd(22) + String(w).padEnd(14) +
    pct(a[w].recall) + "%  " + nums
  );
}

// failures
const errs = rows.filter((r) => r.error);
if (errs.length) {
  console.log("\n" + "=".repeat(82));
  console.log(`FAILURES (${errs.length})`);
  console.log("=".repeat(82));
  for (const e of errs.slice(0, 25)) {
    console.log(`  ${String(e.extractor).padEnd(12)} ${e.error.slice(0, 60).padEnd(62)} ${e.url.slice(0, 50)}`);
  }
}
