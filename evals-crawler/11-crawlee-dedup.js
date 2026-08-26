/**
 * Does Crawlee's built-in deduplication actually catch OUR duplicates?
 *
 * The docs say uniqueKey is derived by "lowercasing the URL, lexically ordering
 * query parameters, removing fragments and a few other tweaks" but do not say
 * whether trailing slashes are normalised - which is the exact cause of the 18
 * duplicate URLs found in chatbots-data.
 *
 *   node evals-crawler/11-crawlee-dedup.js
 */

const { Request } = require("crawlee");

// pairs taken from the real duplicates in the crawl records
const PAIRS = [
  ["https://floatco.com", "https://floatco.com/", "trailing slash (18 real dupes)"],
  ["https://mall.livall.com", "https://mall.livall.com/", "trailing slash"],
  ["https://floatco.com/faq", "https://floatco.com/faq/", "trailing slash on path"],
  ["https://floatco.com/faq", "https://FloatCo.com/faq", "case"],
  ["https://floatco.com/faq", "https://floatco.com/faq#top", "fragment"],
  [
    "https://marketplace.spica.com/x?list_view=1&p=2",
    "https://marketplace.spica.com/x?p=2&list_view=1",
    "query order",
  ],
  [
    "https://marketplace.spica.com/x?list_view=1",
    "https://marketplace.spica.com/x?list_view=1&p=1",
    "page 1 vs implicit page 1",
  ],
  ["https://floatco.com/faq", "https://www.floatco.com/faq", "www vs bare"],
  ["http://floatco.com/faq", "https://floatco.com/faq", "http vs https"],
];

const key = (url) => new Request({ url }).uniqueKey;

console.log("Crawlee default uniqueKey - does it collapse our duplicates?\n");
console.log("match  case".padEnd(48) + "uniqueKey A");
console.log("-".repeat(96));

let caught = 0;
for (const [a, b, label] of PAIRS) {
  const ka = key(a);
  const kb = key(b);
  const same = ka === kb;
  if (same) caught++;
  console.log(
    `${same ? " YES " : " no  "}  ${label.padEnd(40)} ${ka}`
  );
  if (!same) console.log(`${" ".repeat(48)}${kb}   <- treated as a different page`);
}

console.log("-".repeat(96));
console.log(`collapsed ${caught} of ${PAIRS.length} duplicate pairs`);
console.log(
  "\nAnything marked 'no' would still be crawled twice and still consume two\n" +
    "slots of the customer's crawl limit, unless a transformRequestFunction\n" +
    "normalises the URL before it reaches the queue."
);
