// import { NextRequest, NextResponse } from "next/server";
// import { apiHandler } from "../../../../_helpers/server/api/api-handler";
// import { chromium } from "playwright";
// import { parse } from "node-html-parser";

// module.exports = apiHandler({
//   GET: fetchLinks,
// });

// const imageLinkRegex =
//   /^https?:\/\/(?:[\w\-]+\.)+[a-zA-Z]{2,20}(?:\/[^\s?]+)*(?:\.(?:jpg|jpeg|png|gif|bmp|svg|webp|tiff))(?:\?.*)?$/i;

// function extractTextAndImageSrc(element: any) {
//   if (
//     element.tagName === "SCRIPT" ||
//     element.tagName === "SVG" ||
//     element.tagName === "STYLE"
//   ) {
//     return "";
//   } else if (element.tagName === "IMG") {
//     // If the element is an image, extract its src attribute
//     const imgSrc = element.getAttribute("src");

//     if (imageLinkRegex.test(imgSrc))
//       return `      image: ${decodeURI(imgSrc)}          `;
//     return "";
//   } else if (element.childNodes.length === 0) {
//     // If the element has no child nodes, return its text
//     if (element.text === undefined) console.log(element.tagName);
//     return element.text;
//   } else {
//     // If the element has child nodes, recursively extract text and image src links from them
//     let text = "";
//     element.childNodes.forEach((child: any) => {
//       text += extractTextAndImageSrc(child);
//     });
//     return text.replace(/(\r\n|\n|\r|\t|)/gm, "").trim();
//   }
// }

// async function fetchLinks(request: NextRequest) {
//   /// get the website to crawl
//   const params = request.nextUrl.searchParams;
//   const sourceUrl: string = params?.get("sourceURL")!;

//   /// check if valid URl
//   const urlRegex = /^https?:\/\/[^\s/$.?#].[^\s]*$/;
//   if (urlRegex.test(sourceUrl)) {
//     const browser = await chromium.launch({ headless: true });
//     const context = await browser.newContext();
//     const page = await context.newPage();

//     const visitedUrls = new Map();
//     const pendingUrls = [sourceUrl];
//     const crawledData = [];

//     while (pendingUrls.length > 0) {
//       const url = pendingUrls.shift();
//       if (!url || visitedUrls.get(url) == true) continue;

//       visitedUrls.set(url, true);

//       try {
//         await page.goto(url, {
//           waitUntil: "networkidle",
//           timeout: 120000,
//         });

//         /// if it is image skip that link
//         if (imageLinkRegex.test(url)) continue;

//         const html = await page.$eval("body", (body) => {
//           return body.innerHTML;
//         });
//         const root = parse(html);
//         const text = extractTextAndImageSrc(root).replace(/<img[^>]*>/g, "");
//         let chunks: any = [];
//         await new Promise((resolve) => {
//           let start = 0;
//           let end = text.length;
//           while (start < end) {
//             const subStr = text.substring(start, start + 2000);
//             chunks.push(subStr);
//             start += 1800;
//           }

//           if (start > end) {
//             resolve(1);
//           }
//         });
//         crawledData.push({
//           crawlLink: url,
//           cleanedText: chunks,
//           charCount: text.length,
//         });

//         const newUrls = await extractUrls(page, sourceUrl);
//         newUrls.forEach((newUrl: any) => {
//           if (!visitedUrls.get(newUrl)) {
//             pendingUrls.push(newUrl);
//           }
//         });

//         console.log(crawledData.length);
//       } catch (error) {
//         console.error(`Error loading ${url}:`, error);
//       }
//     }
//     await page.close();
//     await context.close();
//     await browser.close();

//     return {
//       fetchedLinks: crawledData,
//     };
//   } else {
//     return { error: "Please enter a valid url" };
//   }
// }

// async function extractUrls(page: any, baseUrl: any) {
//   // console.log('user input', baseUrl);
//   const hrefs = await page.$$eval(
//     "a",
//     (links: any, baseUrl: any) => {
//       // Function to add or remove 'www' subdomain based on baseUrl
//       const adjustWwwSubdomain = (url: any, baseUrl: any) => {
//         const urlObj = new URL(url);
//         const baseObj = new URL(baseUrl);

//         if (baseObj.hostname.startsWith("www.")) {
//           // If baseUrl has 'www' subdomain, ensure 'www' in extracted URLs
//           if (!urlObj.hostname.startsWith("www.")) {
//             urlObj.hostname = "www." + urlObj.hostname;
//           }
//         } else {
//           // If baseUrl doesn't have 'www' subdomain, remove 'www' in extracted URLs
//           urlObj.hostname = urlObj.hostname.replace(/^www\./, "");
//         }

//         return urlObj.href;
//       };

//       return links.map((link: any) => {
//         try {
//           let href = link.href;

//           // Ignore empty hrefs or hash-only hrefs
//           if (!href || href === "#" || href.startsWith("javascript:")) {
//             return null;
//           }

//           // Convert relative URLs to absolute URLs
//           if (href.startsWith("/")) {
//             const protocol = baseUrl.startsWith("https://")
//               ? "https://"
//               : "http://";
//             href = protocol + new URL(href, baseUrl).hostname + href;
//           }

//           // Handle protocol-relative URLs
//           if (href.startsWith("//")) {
//             const protocol = baseUrl.startsWith("https://")
//               ? "https:"
//               : "http:";
//             href = protocol + href;
//           }

//           const fragment = href.split("/").pop().startsWith("#");
//           if (fragment) {
//             const arr = href.split("#");
//             href = arr[0];
//           }
//           const includesHash =
//             !href.split("/").pop().startsWith("#") &&
//             href.split("/").pop().includes("#");
//           if (includesHash) {
//             return null;
//           }

//           // Ensure 'www' subdomain consistency
//           href = adjustWwwSubdomain(href, baseUrl);
//           return href;
//         } catch (error) {
//           return null; // Ignore invalid URLs
//         }
//       });
//     },
//     baseUrl
//   );

//   const filteredUrls = hrefs.filter((href: any) => {
//     const domain = new URL(baseUrl).hostname;
//     return href !== null && href.startsWith(baseUrl);
//   });
//   return filteredUrls;
// }

import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "../../../../_helpers/server/api/api-handler";
// import { chromium } from "playwright";
import * as puppeteer from "puppeteer";
import chromium from "@sparticuz/chromium-min";
import clientPromise from "../../../../../db";
import { ObjectId } from "mongodb";
import {
  chunkPageText,
  dropRepeatedBlocks,
  extractPageText,
  normalizeUrl,
  shouldCrawl,
} from "../../../../_helpers/server/crawl-extract";

module.exports = apiHandler({
  POST: fetchLinks,
});

export const maxDuration = 300;

/// One page must not be able to consume the whole invocation. At the previous
/// 180s, two slow pages alone exceeded maxDuration and the request died as a
/// 504 with every page already crawled thrown away.
const NAVIGATION_TIMEOUT_MS = 25000;

/// Stop crawling well before maxDuration, leaving time to serialise and return
/// what has been collected. A partial answer is worth far more than a 504.
const CRAWL_BUDGET_MS = 220000;

/// Ceiling on the queue handed back for a follow-up request, so the response
/// body cannot grow without bound on a large site.
const RESUME_QUEUE_CAP = 500;

/// Text extraction reads the DOM, never the pixels. These are most of a page's
/// bytes and requests, and blocking them is what makes a crawl fast.
const BLOCKED_RESOURCE_TYPES = new Set([
  "image",
  "media",
  "font",
  "stylesheet",
]);

const imageLinkRegex =
  /^https?:\/\/(?:[\w\-]+\.)+[a-zA-Z]{2,20}(?:\/[^\s?]+)*(?:\.(?:jpg|jpeg|png|gif|bmp|svg|webp|tiff))(?:\?.*)?$/i;

async function fetchLinks(request: NextRequest) {
  /// get the website to crawl
  // const params = request.nextUrl.searchParams;
  // const sourceUrl: string = params?.get("sourceURL")!;
  const data = await request.json();
  const sourceUrl = data?.sourceURL;
  const chatbotId = data?.chatbotId;
  const userId = data?.userId;

  /// state handed back by a previous request that ran out of time budget
  const resumePending: string[] = Array.isArray(data?.pendingUrls)
    ? data.pendingUrls
    : [];
  const resumeVisited: string[] = Array.isArray(data?.visitedUrls)
    ? data.visitedUrls
    : [];
  const alreadyCrawled: number = Number(data?.crawledCount) || 0;

  /// check if valid URl
  const urlRegex = /^https?:\/\/[^\s/$.?#].[^\s]*$/;
  if (urlRegex.test(sourceUrl)) {
    /// first check how much link user can crawl
    const db = (await clientPromise!).db();

    /// get the user plan and allow only crawling of the amount of links left
    const userDetails = await db
      .collection("user-details")
      .findOne({ userId: userId });

    /// find how many link are previously fetched  by this user for this bot
    const chatBotDataCollection = db.collection("chatbots-data");
    const previousFetches = await chatBotDataCollection.findOne({
      chatbotId: chatbotId!,
      source: "crawling",
    });

    let limit = 0;
    /// if previousFetches are null then crawl link
    if (!previousFetches) {
      limit = userDetails?.websiteCrawlingLimit;
    } else {
      limit =
        userDetails?.websiteCrawlingLimit - previousFetches?.content.length;
    }

    /// pages collected by earlier batches of this same crawl are not in the
    /// database yet - they are stored once the user saves - so the allowance
    /// has to account for them here or a resumed crawl would overshoot it
    /// websiteCrawlingLimit is written as a string on some accounts, and is
    /// absent entirely if user-details is missing - both used to leave the page
    /// cap as NaN, which no comparison stops
    limit = (Number(limit) || 0) - alreadyCrawled;

    if (limit <= 0) {
      return {
        error:
          "Oops! You have reached the crawling limit of your plan. Please upgrade to crawl more websites.",
      };
    }

    /// The serverless build downloads a Chromium pack built for Linux, which
    /// cannot run on a developer machine - that is why the local launch was
    /// commented out and crawling could only be tested by deploying.
    const isServerless =
      !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;

    const browser = isServerless
      ? await puppeteer.launch({
          args: [
            ...chromium.args,
            "--hide-scrollbars",
            "--disable-web-security",
          ],
          defaultViewport: chromium.defaultViewport,
          executablePath: await chromium.executablePath(
            process.env.CHROMIUM_PACK_URL ||
              `https://github.com/Sparticuz/chromium/releases/download/v122.0.0/chromium-v122.0.0-pack.tar`
          ),
          // @ts-ignore
          headless: chromium.headless,
          ignoreHTTPSErrors: true,
        })
      : await puppeteer.launch({
          headless: true,
          ignoreHTTPSErrors: true,
        });
    // const browser = await puppeteer.launch({
    //   headless: false,
    // });
    // const context = await browser.newContext();

    console.log("browser launched !");

    const page = await browser.newPage();
    console.log(" page created !");

    /// Abort what the extractor never reads. This is the single biggest win on
    /// crawl time: images, video, fonts and stylesheets are most of the bytes
    /// and most of the requests on a typical marketing page.
    await page.setRequestInterception(true);
    page.on("request", (req: any) => {
      if (BLOCKED_RESOURCE_TYPES.has(req.resourceType())) {
        req.abort().catch(() => {});
      } else {
        req.continue().catch(() => {});
      }
    });
    page.setDefaultNavigationTimeout(NAVIGATION_TIMEOUT_MS);

    /// Scope the crawl to the host the seed actually lands on. Resolving the
    /// redirect first is what stops a crawl collapsing to a single page when
    /// the customer's domain forwards elsewhere.
    let siteHost = new URL(sourceUrl).hostname.replace(/^www\./, "");
    try {
      await page.goto(sourceUrl, {
        waitUntil: "domcontentloaded",
        timeout: NAVIGATION_TIMEOUT_MS,
      });
      siteHost = new URL(page.url()).hostname.replace(/^www\./, "");
      if (siteHost !== new URL(sourceUrl).hostname.replace(/^www\./, "")) {
        console.log(`[crawl] ${sourceUrl} redirects to ${page.url()} - scoping to ${siteHost}`);
      }
    } catch (e) {
      console.warn(`[crawl] could not resolve seed, scoping to ${siteHost}`);
    }

    const visitedUrls = new Map<string, boolean>();
    for (const seen of resumeVisited) {
      const seenKey = normalizeUrl(seen);
      if (seenKey) visitedUrls.set(seenKey, true);
    }
    const pendingUrls: string[] =
      resumePending.length > 0 ? [...resumePending] : [sourceUrl];
    const crawledPages: { crawlLink: string; text: string }[] = [];

    /// The crawl is bounded by wall-clock time, not only by page count. Running
    /// past the platform's function ceiling returns a 504 and loses every page
    /// crawled so far; stopping short returns them and reports what is left, so
    /// the client can ask for the rest in a second request.
    const deadline = Date.now() + CRAWL_BUDGET_MS;
    let outOfBudget = false;

    try {
      while (pendingUrls.length > 0) {
        if (Date.now() > deadline) {
          outOfBudget = true;
          console.log(
            `[crawl] time budget spent after ${crawledPages.length} pages, ${pendingUrls.length} still queued`
          );
          break;
        }

        const url = pendingUrls.shift();
        if (!url) continue;
        /// de-duplicate on the canonical form, not the raw string: 18 stored
        /// pages were the same URL with and without a trailing slash, and each
        /// one consumed a slot of the customer's crawl allowance
        const key = normalizeUrl(url);
        if (!key || visitedUrls.get(key) === true) continue;
        /// skip image links before paying for a navigation, not after
        if (imageLinkRegex.test(url)) continue;
        visitedUrls.set(key, true);

        try {
          /// domcontentloaded rather than networkidle2: the text comes out of
          /// the DOM, so waiting for analytics, chat widgets and consent
          /// scripts to fall quiet buys nothing. A page holding an open socket
          /// never falls quiet at all and used to burn the entire navigation
          /// timeout on its own.
          await page.goto(url, {
            waitUntil: "domcontentloaded",
            timeout: NAVIGATION_TIMEOUT_MS,
          });

          const html = await page.$eval("body", (body) => {
            return body.innerHTML;
          });

          /// chunking is deferred until the whole page set is known: repeated
          /// chrome can only be recognised by comparing pages against each
          /// other, and it has to go before the text is split
          crawledPages.push({ crawlLink: url, text: extractPageText(html) });

          if (crawledPages.length >= limit) break;

          const newUrls = await extractUrls(page, sourceUrl);
          for (const newUrl of newUrls) {
            const normalized = normalizeUrl(newUrl);
            if (normalized && !visitedUrls.get(normalized) && shouldCrawl(newUrl, siteHost)) {
              pendingUrls.push(normalized);
            }
          }

          console.log(crawledPages.length);
        } catch (error) {
          console.error(`Error loading ${url}:`, error);
        }
      }
    } finally {
      /// the early return on reaching the plan limit used to leave the browser
      /// open, holding the invocation until the platform killed it.
      /// close() itself is known to hang on serverless Chromium, so it is
      /// raced against a timer - a leaked browser in a container about to be
      /// frozen costs nothing, a hung close costs the whole response
      await closeQuietly(page);
      await closeQuietly(browser);
    }

    /// menus, newsletter blocks and footers repeat on every page of a site, so
    /// they are embedded once per page and then crowd out the page content at
    /// retrieval time. They can only be spotted by comparing the pages, which
    /// is why this runs here rather than inside the loop.
    const deduped = dropRepeatedBlocks(
      crawledPages.map((p) => ({ text: p.text }))
    );

    const crawledData = [];
    for (let i = 0; i < crawledPages.length; i++) {
      const text = deduped[i] ?? crawledPages[i].text;
      crawledData.push({
        crawlLink: crawledPages[i].crawlLink,
        cleanedText: await chunkPageText(text),
        charCount: text.length,
      });
    }

    const morePending =
      outOfBudget && pendingUrls.length > 0 && crawledData.length < limit;

    return {
      fetchedLinks: crawledData,
      /// the client asks for the remainder in a follow-up request rather than
      /// holding one connection open past the function timeout
      partial: morePending,
      pendingUrls: morePending ? pendingUrls.slice(0, RESUME_QUEUE_CAP) : [],
      visitedUrls: morePending
        ? Array.from(visitedUrls.keys()).slice(0, RESUME_QUEUE_CAP * 4)
        : [],
    };
  } else {
    return { error: "Please enter a valid url" };
  }
}

const CLOSE_TIMEOUT_MS = 5000;

/// close() is known to hang on serverless Chromium; race it so a stuck browser
/// cannot take the whole response down with it
async function closeQuietly(target: any) {
  if (!target) return;
  await Promise.race([
    target.close().catch(() => {}),
    new Promise((resolve) => setTimeout(resolve, CLOSE_TIMEOUT_MS)),
  ]);
}

async function extractUrls(page: any, baseUrl: any) {
  // console.log('user input', baseUrl);
  const hrefs = await page.$$eval(
    "a",
    (links: any, baseUrl: any) => {
      // Function to add or remove 'www' subdomain based on baseUrl
      const adjustWwwSubdomain = (url: any, baseUrl: any) => {
        const urlObj = new URL(url);
        const baseObj = new URL(baseUrl);

        if (baseObj.hostname.startsWith("www.")) {
          // If baseUrl has 'www' subdomain, ensure 'www' in extracted URLs
          if (!urlObj.hostname.startsWith("www.")) {
            urlObj.hostname = "www." + urlObj.hostname;
          }
        } else {
          // If baseUrl doesn't have 'www' subdomain, remove 'www' in extracted URLs
          urlObj.hostname = urlObj.hostname.replace(/^www\./, "");
        }

        return urlObj.href;
      };

      return links.map((link: any) => {
        try {
          let href = link.href;

          // Ignore empty hrefs or hash-only hrefs
          if (!href || href === "#" || href.startsWith("javascript:")) {
            return null;
          }

          // Convert relative URLs to absolute URLs
          if (href.startsWith("/")) {
            const protocol = baseUrl.startsWith("https://")
              ? "https://"
              : "http://";
            href = protocol + new URL(href, baseUrl).hostname + href;
          }

          // Handle protocol-relative URLs
          if (href.startsWith("//")) {
            const protocol = baseUrl.startsWith("https://")
              ? "https:"
              : "http:";
            href = protocol + href;
          }

          const fragment = href.split("/").pop().startsWith("#");
          if (fragment) {
            const arr = href.split("#");
            href = arr[0];
          }
          const includesHash =
            !href.split("/").pop().startsWith("#") &&
            href.split("/").pop().includes("#");
          if (includesHash) {
            return null;
          }

          // Ensure 'www' subdomain consistency
          href = adjustWwwSubdomain(href, baseUrl);
          return href;
        } catch (error) {
          return null; // Ignore invalid URLs
        }
      });
    },
    baseUrl
  );

  /// Scoping happens in the caller via shouldCrawl(), which compares hostnames
  /// against the host the seed landed on. The previous rule here was
  /// href.startsWith(baseUrl), which dropped every sibling link whenever the
  /// customer entered a URL containing a path, or their domain redirected -
  /// silently reducing the whole crawl to a single page.
  return hrefs.filter((href: any) => href !== null);
}
