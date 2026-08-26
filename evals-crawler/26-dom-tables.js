/**
 * Stage A, fourth variant - reconstruct CSS-grid tables from rendered geometry.
 *
 * The text-based repair failed four times for a structural reason: it tries to
 * rebuild a relationship that extraction already destroyed. At crawl time we
 * are still inside the browser, where every element has a position, so the
 * label and its price are simply two boxes in the same column.
 *
 * This is prior art rather than invention - "find visualised element nodes,
 * find sets that can form tables according to spatial conditions, and transfer
 * content into a topological grid description".
 *
 * Approach: cluster visible text boxes into rows by y, align them into columns
 * by x, and where consecutive rows share a column structure, replace the region
 * with a real <table>. Turndown then emits a correct markdown table - which it
 * already does perfectly on gov.uk's real tables (3/3 in Stage A).
 *
 * No LLM. Deterministic. Free.
 *
 *   node evals-crawler/26-dom-tables.js
 */

const fs = require("fs");
const path = require("path");
const TurndownService = require("turndown");
const { gfm } = require("turndown-plugin-gfm");

const OUT = path.join(__dirname, "results");

/**
 * Runs inside the page. Returns the number of tables rewritten.
 * Written as a single self-contained function because it is injected.
 */
function rewriteGridTables(opts) {
  const { rowTol, colTol, minCols, minRows } = opts;

  // 1. candidate cells: elements whose text is their own, not a container's
  const cells = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
  let el;
  while ((el = walker.nextNode())) {
    if (["SCRIPT", "STYLE", "NOSCRIPT", "SVG", "IFRAME"].includes(el.tagName)) continue;
    // own text only - skip wrappers whose text comes from descendants
    const ownText = Array.from(el.childNodes)
      .filter((n) => n.nodeType === Node.TEXT_NODE)
      .map((n) => n.textContent)
      .join("")
      .replace(/\s+/g, " ")
      .trim();
    if (!ownText) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    const style = getComputedStyle(el);
    if (style.visibility === "hidden" || style.display === "none" || style.opacity === "0") continue;
    cells.push({
      el,
      text: ownText,
      x: r.left + window.scrollX,
      y: r.top + window.scrollY,
      cx: r.left + r.width / 2 + window.scrollX,
      w: r.width,
      h: r.height,
    });
  }
  if (cells.length < minCols * minRows) return { tables: 0, cells: cells.length };

  // 2. cluster into visual rows by vertical position
  cells.sort((a, b) => a.y - b.y || a.x - b.x);
  const rows = [];
  for (const c of cells) {
    const last = rows[rows.length - 1];
    if (last && Math.abs(c.y - last.y) <= Math.max(rowTol, Math.min(c.h, last.h) / 2)) {
      last.cells.push(c);
      last.y = (last.y * (last.cells.length - 1) + c.y) / last.cells.length;
    } else {
      rows.push({ y: c.y, h: c.h, cells: [c] });
    }
  }
  for (const r of rows) r.cells.sort((a, b) => a.x - b.x);

  // 3. consecutive rows sharing a column structure form a table
  const columnsMatch = (a, b) => {
    if (a.cells.length !== b.cells.length || a.cells.length < minCols) return false;
    return a.cells.every((c, i) => Math.abs(c.cx - b.cells[i].cx) <= colTol);
  };

  const blocks = [];
  let i = 0;
  while (i < rows.length) {
    let j = i;
    while (j + 1 < rows.length && columnsMatch(rows[j], rows[j + 1])) j++;
    if (j - i + 1 >= minRows) blocks.push(rows.slice(i, j + 1));
    i = j + 1;
  }

  // 4. replace each block with a real <table>
  let built = 0;
  for (const block of blocks) {
    const table = document.createElement("table");
    // turndown's gfm plugin only emits a markdown table when there is a header
    // row - without thead/th it silently falls back to plain text, which is why
    // gov.uk went from 6 markdown table rows to 0 on the first attempt
    const thead = document.createElement("thead");
    const headTr = document.createElement("tr");
    for (const c of block[0].cells) {
      const th = document.createElement("th");
      th.textContent = c.text;
      headTr.appendChild(th);
    }
    thead.appendChild(headTr);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    for (const row of block.slice(1)) {
      const tr = document.createElement("tr");
      for (const c of row.cells) {
        const td = document.createElement("td");
        td.textContent = c.text;
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    // insert before the first cell's highest ancestor still inside the block,
    // then remove the original cells so their text is not emitted twice
    const first = block[0].cells[0].el;
    if (!first.parentNode) continue;
    first.parentNode.insertBefore(table, first);
    for (const row of block) {
      for (const c of row.cells) {
        if (c.el.parentNode) c.el.textContent = "";
      }
    }
    built++;
  }
  return { tables: built, cells: cells.length, rows: rows.length, blocks: blocks.length };
}

async function extractWithGridTables(page, opts = {}) {
  const settings = { rowTol: 8, colTol: 40, minCols: 2, minRows: 2, ...opts };
  const stats = await page.evaluate(rewriteGridTables, settings);
  const html = await page.evaluate(() => document.body.innerHTML);
  return { html, stats };
}

module.exports = { rewriteGridTables, extractWithGridTables };

// ── standalone: run the Stage A measurement against this variant ─────────────
if (require.main === module) {
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
    if (li === -1) return { ...pair, labelPresent: false, valuePresent: t.includes(pair.value), intruders: null };
    const after = t.slice(li + pair.label.length);
    const vi = after.indexOf(pair.value);
    if (vi === -1) return { ...pair, labelPresent: true, valuePresent: t.includes(pair.value), intruders: null };
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
      let plain = null;
      let grid = null;
      let stats = null;

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
            plain = await p.evaluate(() => document.body.innerHTML);
            const res = await extractWithGridTables(p);
            grid = res.html;
            stats = res.stats;
          },
        },
        new Configuration({ persistStorage: false })
      );
      await crawler.run([page.url]);
      if (!plain) {
        console.log(`${page.id}: FETCH FAILED`);
        continue;
      }

      console.log(`\n=== ${page.id} ===`);
      console.log(
        `  geometry: ${stats.cells} text boxes, ${stats.rows} visual rows, ` +
          `${stats.blocks} table blocks, ${stats.tables} rewritten`
      );

      for (const [name, html] of [["turndown", plain], ["turndown+domtables", grid]]) {
        const text = td.turndown(html);
        const res = page.pairs.map((p) => measurePair(text, p, page.tableValues));
        const attached = res.filter((r) => r.intruders === 0).length;
        const found = res.filter((r) => r.valuePresent).length;
        const mdRows = (text.match(/^\|.*\|$/gm) || []).length;
        rows.push({ page: page.id, variant: name, attached, found, total: page.pairs.length, mdRows, res });
        console.log(
          `  ${name.padEnd(20)} values ${found}/${page.pairs.length}  ` +
            `attached ${attached}/${page.pairs.length}  markdown table rows ${mdRows}`
        );
        for (const r of res) {
          const v = !r.valuePresent ? "VALUE MISSING"
            : r.intruders === null ? "value never follows label"
            : r.intruders === 0 ? `attached (gap ${r.distance})`
            : `DETACHED (${r.intruders} between)`;
          console.log(`      ${r.label.padEnd(22)} ${r.value.padEnd(8)} ${v}`);
        }
      }
    }

    fs.mkdirSync(OUT, { recursive: true });
    fs.writeFileSync(path.join(OUT, "stage-a-domtables.json"), JSON.stringify(rows, null, 2));

    console.log("\n" + "=".repeat(64));
    for (const name of ["turndown", "turndown+domtables"]) {
      const r = rows.filter((x) => x.variant === name);
      const att = r.reduce((a, b) => a + b.attached, 0);
      const tot = r.reduce((a, b) => a + b.total, 0);
      const fnd = r.reduce((a, b) => a + b.found, 0);
      console.log(`${name.padEnd(22)} values ${fnd}/${tot}   correctly attached ${att}/${tot}`);
    }
    console.log("=".repeat(64));
    console.log("cost $0.00 - no model involved");
  })();
}
