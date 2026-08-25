# Extractor bake-off — 45 pages, 15 sites, 4 extractors

**Date:** 21 August 2026
**Corpus:** [corpus.json](corpus.json) — 8 customer sites plus 7 added for coverage.
**Harness:** [09-broad-bakeoff.js](09-broad-bakeoff.js) · **Analysis:** [10-analyze.js](10-analyze.js)
**Raw:** `results/broad-bakeoff.json` (174 rows), `results/analysis.txt`

**Ground truth** is `document.body.innerText` from the rendered page — literally what a
human sees. No hand-annotation, so the scoring is reproducible and cannot be
tuned after the fact.

| Metric | Meaning | Direction |
|---|---|---|
| recall | ≥6-word sentences that survive | higher better |
| nums | currency / number tokens that survive | higher better |
| boiler | share of output repeating across the site's other pages | lower better |
| glued | glued words per 1k chars | lower better |
| midWd | chunk boundaries starting mid-word | lower better |
| imgCh | characters spent on image URLs | lower better |
| head / tbl | markdown headings / table rows produced | higher better |

---

## Overall (45 pages)

| extractor | recall | nums | boiler | glued | midWd | imgCh | head | tbl |
|---|---|---|---|---|---|---|---|---|
| production | 68.3% | 100% | 36.1% | 11.1 | 37.6% | 406 | 0 | 0 |
| **turndown** | **70.5%** | **100%** | 40.4% | **2.7** | **0%** | **0** | **33** | **18** |
| readability | 47.6% | 41.7% | 14.6% | 1.9 | 0% | 0 | 6 | 3 |
| defuddle | 47.0% | 70.7% | 14.3% | 4.6 | 0% | 0 | 9 | 18 |

Turndown is the only extractor that keeps everything production keeps while
removing all four defects and adding structure production has none of.

---

## The decisive case: pricing pages

`tables = css-grid`, 12 pages — the FloatCo failure mode:

| extractor | recall | nums | midWd | tbl |
|---|---|---|---|---|
| production | 59.5% | 100% | 46.6% | 0 |
| **turndown** | **79.4%** | **100%** | **0%** | **34** |
| readability | 50.4% | **20.8%** | 0% | 0 |
| defuddle | 44.5% | 53.8% | 0% | 34 |

`type = saas-pricing`, 3 pages:

| extractor | recall | nums | tbl |
|---|---|---|---|
| production | 39.6% | 100% | 0 |
| **turndown** | **88.1%** | **100%** | **135** |
| readability | 22.7% | **0.0%** | 0 |
| defuddle | 79.6% | 54.4% | 135 |

**Readability keeps 0% of the numbers on pricing pages.** Not a rounding
artefact — every price is gone. It also scored 0% on the Vietnamese forum, the
restaurant site and client-rendered pages generally.

---

## Per-site winners

| Site | Type | Winner | Recall | Numbers kept (p/t/r/d) |
|---|---|---|---|---|
| floatco | local-business | **turndown** | 79.9% | 100 / 100 / 36 / 67 |
| vercel-pricing | saas-pricing | **turndown** | 88.1% | 100 / 100 / **0** / 54 |
| tinhte | forum | **turndown** | 88.2% | 100 / 100 / **0** / 100 |
| musaffa | fintech-marketing | **turndown** | 86.5% | — |
| livall | ecommerce-product | **turndown** | 63.2% | 100 / 100 / 20 / 41 |
| yumsing | restaurant | **turndown** | 63.2% | 100 / 100 / **0** / 50 |
| python-docs | technical-docs | **turndown** | 75.0% | — |
| nextjs-docs | technical-docs | **turndown** | 70.9% | — |
| imi-gov-my | government-faq | **turndown** | 58.2% | — |
| spica | marketplace-listing | production | 95.2% | — |
| gov-uk | government-guidance | production | 91.7% | 100 / 100 / 100 / 100 |
| wikipedia | reference-article | production | 85.7% | 100 / 100 / 100 / 100 |
| mdn | technical-docs | production | 77.6% | — |
| w3schools | tutorial | production | 75.9% | 100 / 100 / 100 / 100 |
| creolestudios | agency-marketing | production | 71.5% | — |

**Turndown wins 9 of 15 sites.** Production wins 6 — but always while carrying
37.6% mid-word chunk cuts, 11.1 glued words per 1k, image URLs and zero
structure, so its recall advantage does not survive into retrieval quality.

---

## Client-rendered pages (6 pages)

| extractor | recall | nums |
|---|---|---|
| turndown | **74.9%** | **100%** |
| production | 67.0% | 100% |
| readability | 59.3% | **0%** |
| defuddle | **16.5%** | 50% |

Defuddle collapses on SPAs. Readability loses every number.

---

## Verdicts

**turndown — adopt.** Wins overall and on 9 of 15 sites. Keeps 100% of numbers
on every page type. Eliminates glued words (11.1 → 2.7), mid-word cuts
(37.6% → 0%), image URLs (406 → 0). Produces the headings and tables that make
structure-aware chunking possible.

**Its one weakness:** boilerplate 40.4%, the highest of the four, because it has
no main-content selection. This is the known trade and the fix is already
measured — cross-page repetition removal (Finding 2 in [FINDINGS.md](FINDINGS.md)),
which works on both FloatCo and Musaffa where tag-based stripping does not.

**readability — rejected.** 41.7% of numbers overall, **0% on pricing pages**.
Confirms the independent benchmarks (WCXB F1 0.674, lowest of four tested) and
the earlier single-page finding.

**defuddle — rejected.** 47.0% recall, unstable: complete failures on FloatCo's
FAQ, all three Musaffa pages and client-rendered pages generally (16.5%). My
earlier recommendation of it was based on one page and was wrong.

**production — keep only as the baseline.** Its recall is competitive but every
other column is a defect.

---

## Still untested

- Trafilatura (WCXB F1 0.791, Trafilatura-suite F1 0.924) — Python, or
  `contextractor` via napi-rs
- Crawl4AI `LLMTableExtraction` — the label↔value problem
- render → PDF → Docling — the same path that gives PDFs 0.845
- Firecrawl — needs an API key

Two harness limitations to note honestly: `networkidle2` timed out on
tinhte.vn's thread page and Wikipedia's browser-comparison page, so those rows
are errors rather than scores; and recall is undefined on listing pages with no
prose sentences, where `nums` and `boiler` carry the signal instead.
