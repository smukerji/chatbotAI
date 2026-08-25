/**
 * Does the chunk loop in route.ts L339-352 ever fail to settle?
 *
 * The Promise resolves only inside `if (start > end)`. When text.length is an
 * exact multiple of the 1800 step, the loop exits with start === end and the
 * condition is false. This runs the block verbatim against a range of lengths
 * with a timeout, and reports which ones never resolve.
 *
 *   node evals-crawler/04-chunker-bug.js
 */

/** VERBATIM from route.ts L339-352 */
function productionChunker(text) {
  let chunks = [];
  return new Promise((resolve) => {
    let start = 0;
    let end = text.length;
    while (start < end) {
      const subStr = text.substring(start, start + 2000);
      chunks.push(subStr);
      start += 1800;
    }

    if (start > end) {
      resolve(1);
    }
  }).then(() => chunks);
}

function withTimeout(p, ms) {
  return Promise.race([
    p.then((v) => ({ settled: true, value: v })),
    new Promise((r) => setTimeout(() => r({ settled: false }), ms)),
  ]);
}

(async () => {
  const lengths = [];
  for (let n = 1; n <= 12; n++) lengths.push(n * 1800); // exact multiples
  lengths.push(1799, 1801, 3599, 3601, 44831, 73517); // controls + two real page sizes

  console.log("length   settled   chunks");
  console.log("-".repeat(34));
  const hangs = [];
  for (const len of lengths.sort((a, b) => a - b)) {
    const text = "x".repeat(len);
    const r = await withTimeout(productionChunker(text), 400);
    const exact = len % 1800 === 0;
    console.log(
      `${String(len).padStart(6)}   ${r.settled ? "yes" : "NO "}      ${
        r.settled ? r.value.length : "-"
      }${exact ? "   <- exact multiple of 1800" : ""}`
    );
    if (!r.settled) hangs.push(len);
  }

  console.log("-".repeat(34));
  console.log(`lengths that never settle: ${hangs.length}`);
  if (hangs.length) {
    console.log(`  ${hangs.join(", ")}`);
    console.log(
      "\nIn route.ts the loop is awaited, so a page whose extracted text hits one\n" +
        "of these lengths hangs the request until the platform times it out."
    );
  }
})();
