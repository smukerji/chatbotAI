# Crawler extraction — measured findings

**Date:** 21 August 2026
**Method:** real customer URLs pulled from `chatbots-data` (source: `crawling`), replayed
through the production functions copied verbatim from
`src/app/(secure)/home/fetch-links/api/route.ts`. No re-implementation, no
simulated pages.

**Scripts**

| File | Purpose |
|---|---|
| `00-inventory.js` | What crawling actually stored, per bot and page |
| `01-stored-shape.js` | Persisted document shape + duplicate URL detection |
| `02-replay.js` | 23 real pages through the production extractor, aggregate metrics |
| `03-inspect.js` | Per-page forensics with corrected boilerplate measurement |
| `04-chunker-bug.js` | Deterministic test of the chunk loop's resolve condition |

Raw output in `results/`.

---

## Corpus

10 crawled bots, 85 stored pages, `charCount` from 1,132 to 324,564.
23 pages replayed across 7 sites (Shopify store, fintech SPA, float-therapy site,
B2B marketplace with pagination, agency site, recipe site, restaurant site).
22 loaded successfully; `https://floatco.com/booking` timed out at 60s.

Storage shape is `{ crawlLink, dataID[], charCount }` — the text itself is not
kept in Mongo, only the Pinecone vector ids. A 73,517-char page produced 41
vector ids, consistent with the 1800-char step.

---

## Finding 1 — Word boundaries are destroyed (12× measured)

`extractTextAndImageSrc` concatenates sibling nodes with no separator, then
[L241](../src/app/(secure)/home/fetch-links/api/route.ts#L241) strips newlines
without substituting a space.

Counting lowercase→uppercase transitions with no space between them:

| | Glued words |
|---|---|
| Production extractor output | **2,646** |
| Same pages, browser `innerText` | 214 |

Real example, FloatCo navigation:

```
Float TherapyCold PlungeFAQMembershipPricingBlogAboutShanghai Float Centre
```

Musaffa: 250 glued words in production output, **0** in `innerText`.

This corrupts tokenisation before embedding. It affects every crawled page.

---

## Finding 2 — Cross-page repetition, not tag-based boilerplate

This corrects an earlier assumption. Boilerplate is **not** reliably detectable
by stripping `<nav>`, `<header>`, `<footer>`, `<aside>`:

| Site | Text inside boilerplate tags | Repeated across that site's pages |
|---|---|---|
| musaffa.com | 98.4% | **100.0%** |
| marketplace.spica.com | 38% | 60.8% |
| mall.livall.com | 27% | 52.1% |
| www.yumsinghouse.com | 28–52% | 36.6% |
| www.allrecipes.com | — | 29.0% |
| www.creolestudios.com | — | 23.9% |
| **floatco.com** | **0.2%** | 9.3% |

FloatCo — the site behind the 0.467 relevancy score — has almost no content in
semantic boilerplate tags, yet its navigation still appears at the head of every
extracted page (see the glued string in Finding 1). Its menu is not marked up as
`<nav>`.

**A selector-based strip would not have fixed the customer whose score prompted
this work.** Cross-page repetition is the signal that works on both sites.

Musaffa is the extreme case: all three replayed pages produced byte-identical
11,760-character output. `<main>` on those pages contains **133 characters**;
the page carries 193 links. Three distinct URLs were stored as the same
mega-menu text.

---

## Finding 3 — Raw HTML leaks into the embedded text

Both sites' extracted text begins with literal markup:

```
<iframe src="https://www.googletagmanager.com/ns.html?id=GTM-PHRF8ZX7"height="0" width="0" style="display:none;visibility:hidden"></iframe>
```

`SCRIPT`, `SVG` and `STYLE` are skipped
([L218-222](../src/app/(secure)/home/fetch-links/api/route.ts#L218)) but
`NOSCRIPT` is not, and `node-html-parser` exposes its contents as text. Every
page on a Google Tag Manager site starts with this string.

FloatCo produces **44,831** characters of extracted text from a page whose
visible `innerText` is **43,077** characters — the extractor emits more than the
page displays.

---

## Finding 4 — Chunking splits mid-word and mid-answer

Fixed 2000-character windows stepping 1800
([L339-352](../src/app/(secure)/home/fetch-links/api/route.ts#L339)).

**60 of 182 chunk boundaries (33%) start mid-word.** Real middle chunk from the
FloatCo FAQ:

```
ntinue to shiver for an extended period of time after the cold plunge...
```

On the FAQ page the natural unit is one question-and-answer pair. Fixed windows
cut them apart, so a retrieved chunk routinely holds the tail of one answer and
the head of the next:

```
...followed by a float.BookingsBookin
```

No page title or heading path is attached to any chunk.

---

## Finding 5 — The chunk loop can hang (reproduced)

The promise resolves only inside `if (start > end)`. When the extracted text
length is an exact multiple of 1800, the loop exits with `start === end` and the
condition is false.

`04-chunker-bug.js`, verbatim code, 400 ms timeout:

| Length | Settles |
|---|---|
| 1,799 | yes |
| **1,800** | **no** |
| 1,801 | yes |
| 3,599 | yes |
| **3,600** | **no** |
| 44,831 (real page) | yes |
| 73,517 (real page) | yes |

All 12 exact multiples tested failed to settle. The call is awaited in
`fetchLinks`, so a page landing on one of these lengths hangs the crawl until
the platform times the function out. Probability per page is roughly 1 in 1,800,
but a crawl covering many pages raises the chance materially.

---

## Finding 6 — Duplicate and low-value URLs consume the plan limit

`01-stored-shape.js` found **18 stored URLs that collapse to a duplicate** once
a trailing slash is normalised — `https://floatco.com` and
`https://floatco.com/` are both stored, along with every other FloatCo page.

The crawl limit is enforced on count
([L272-286](../src/app/(secure)/home/fetch-links/api/route.ts#L272)), so
duplicates are charged against the customer's plan.

Pagination is also crawled as distinct pages: `?list_view=1`, `?list_view=1&p=1`
and `?list_view=1&p=2` on marketplace.spica.com were stored separately, with
60.8% of their content repeated between them.

---

## Correction to an earlier statement

Image URLs injected by
[L229](../src/app/(secure)/home/fetch-links/api/route.ts#L229) were previously
described as a significant source of noise. Measured across 22 pages: **13
markers, 1,219 characters total.** It is real but minor, and should not be
prioritised.

---

## What the evidence supports doing, in order

1. **Emit block-separated text.** Join block-level nodes with newlines instead of
   concatenating. Addresses Finding 1, which affects every page.
2. **Skip `NOSCRIPT`, `IFRAME`, `TEMPLATE`.** One-line change, Finding 3.
3. **Fix the resolve condition** to `start >= end`, or drop the promise wrapper —
   the loop is synchronous. Finding 5.
4. **Remove repeated blocks per site** after the crawl completes, using the
   cross-page measurement in Finding 2. This is the change that works on both
   FloatCo and Musaffa.
5. **Chunk on structure** — split on headings and paragraph boundaries, bound by
   size, and prepend the page title and heading path. Finding 4.
6. **Normalise URLs** before queueing; skip pagination parameters. Finding 6.

Baseline to beat: contextual relevancy **0.467** on crawled content, against
**0.845** for PDF-sourced content, from the existing DeepEval component suite.
