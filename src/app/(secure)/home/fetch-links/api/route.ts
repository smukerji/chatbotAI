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

import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '../../../../_helpers/server/api/api-handler';
// import { chromium } from "playwright";
import * as puppeteer from 'puppeteer';
import { parse } from 'node-html-parser';
import chromium from '@sparticuz/chromium-min';
import clientPromise from '../../../../../db';
import { ObjectId } from 'mongodb';

module.exports = apiHandler({
  POST: fetchLinks,
});

export const maxDuration = 300;

const imageLinkRegex =
  /^https?:\/\/(?:[\w\-]+\.)+[a-zA-Z]{2,20}(?:\/[^\s?]+)*(?:\.(?:jpg|jpeg|png|gif|bmp|svg|webp|tiff))(?:\?.*)?$/i;

function extractTextAndImageSrc(element: any) {
  if (
    element.tagName === 'SCRIPT' ||
    element.tagName === 'SVG' ||
    element.tagName === 'STYLE'
  ) {
    return '';
  } else if (element.tagName === 'IMG') {
    // If the element is an image, extract its src attribute
    const imgSrc = element.getAttribute('src');

    if (imageLinkRegex.test(imgSrc))
      return `      image: ${decodeURI(imgSrc)}          `;
    return '';
  } else if (element.childNodes.length === 0) {
    // If the element has no child nodes, return its text
    if (element.text === undefined) console.log(element.tagName);
    return element.text;
  } else {
    // If the element has child nodes, recursively extract text and image src links from them
    let text = '';
    element.childNodes.forEach((child: any) => {
      text += extractTextAndImageSrc(child);
    });
    return text.replace(/(\r\n|\n|\r|\t|)/gm, '').trim();
  }
}

async function fetchLinks(request: NextRequest) {
  /// get the website to crawl
  // const params = request.nextUrl.searchParams;
  // const sourceUrl: string = params?.get("sourceURL")!;
  const data = await request.json();
  const sourceUrl = data?.sourceURL;
  const chatbotId = data?.chatbotId;
  const userId = data?.userId;

  /// check if valid URl
  const urlRegex = /^https?:\/\/[^\s/$.?#].[^\s]*$/;
  if (urlRegex.test(sourceUrl)) {
    /// first check how much link user can crawl
    const db = (await clientPromise!).db();

    /// get the user plan and allow only crawling of the amount of links left
    const userDetails = await db
      .collection('user-details')
      .findOne({ userId: userId });

    /// find how many link are previously fetched  by this user for this bot
    const chatBotDataCollection = db.collection('chatbots-data');
    const previousFetches = await chatBotDataCollection.findOne({
      chatbotId: chatbotId!,
      source: 'crawling',
    });

    let limit = 0;
    /// if previousFetches are null then crawl link
    if (!previousFetches) {
      limit = userDetails?.websiteCrawlingLimit;
    } else {
      limit =
        userDetails?.websiteCrawlingLimit - previousFetches?.content.length;
    }

    if (limit === 0) {
      return {
        error:
          'Oops! You have reached the crawling limit of your plan. Please upgrade to crawl more websites.',
      };
    }

    const browser = await puppeteer.launch({
      /// this code only run for vercel dvelopment
      args: [...chromium.args, '--hide-scrollbars', '--disable-web-security'],
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(
        // `https://github.com/Sparticuz/chromium/releases/download/v119.0.2/chromium-v119.0.2-pack.tar`
        `https://github.com/Sparticuz/chromium/releases/download/v122.0.0/chromium-v122.0.0-pack.tar`
      ),
      headless: chromium.headless,
      ignoreHTTPSErrors: true,

      /// to run puppeteer on local
      // headless: true,
    });
    // const browser = await puppeteer.launch({
    //  headless:false
    // });
    // const context = await browser.newContext();

    console.log('browser launched !');

    const page = await browser.newPage();
    console.log(' page created !');

    const visitedUrls = new Map();
    const pendingUrls = [sourceUrl];
    const crawledData = [];

    while (pendingUrls.length > 0) {
      const url = pendingUrls.shift();
      if (!url || visitedUrls.get(url) == true) continue;

      visitedUrls.set(url, true);

      try {
        await page.goto(url, {
          // waitUntil: "networkidle",
          waitUntil: 'networkidle2',
          timeout: 180000,
        });

        /// if it is image skip that link
        if (imageLinkRegex.test(url)) continue;

        const html = await page.$eval('body', (body) => {
          return body.innerHTML;
        });
        const root = parse(html);
        const text = extractTextAndImageSrc(root).replace(/<img[^>]*>/g, '');
        let chunks: any = [];
        await new Promise((resolve) => {
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
        });
        crawledData.push({
          crawlLink: url,
          cleanedText: chunks,
          charCount: text.length,
        });

        if (crawledData.length === limit) {
          return {
            fetchedLinks: crawledData,
          };
        }

        const newUrls = await extractUrls(page, sourceUrl);
        newUrls.forEach((newUrl: any) => {
          if (!visitedUrls.get(newUrl)) {
            pendingUrls.push(newUrl);
          }
        });

        console.log(crawledData.length);
      } catch (error) {
        console.error(`Error loading ${url}:`, error);
      }
    }
    await page.close();
    await browser.close();

    return {
      fetchedLinks: crawledData,
    };
  } else {
    return { error: 'Please enter a valid url' };
  }
}

async function extractUrls(page: any, baseUrl: any) {
  console.log(baseUrl);

  // console.log('user input', baseUrl);
  const hrefs = await page.$$eval(
    'a',
    (links: any, baseUrl: any) => {
      // Function to add or remove 'www' subdomain based on baseUrl
      const adjustWwwSubdomain = (url: any, baseUrl: any) => {
        const urlObj = new URL(url);
        const baseObj = new URL(baseUrl);

        if (baseObj.hostname.startsWith('www.')) {
          // If baseUrl has 'www' subdomain, ensure 'www' in extracted URLs
          if (!urlObj.hostname.startsWith('www.')) {
            urlObj.hostname = 'www.' + urlObj.hostname;
          }
        } else {
          // If baseUrl doesn't have 'www' subdomain, remove 'www' in extracted URLs
          urlObj.hostname = urlObj.hostname.replace(/^www\./, '');
        }

        return urlObj.href;
      };

      return links.map((link: any) => {
        try {
          let href = link.href;

          // Ignore empty hrefs or hash-only hrefs
          if (!href || href === '#' || href.startsWith('javascript:')) {
            return null;
          }

          // Convert relative URLs to absolute URLs
          if (href.startsWith('/')) {
            const protocol = baseUrl.startsWith('https://')
              ? 'https://'
              : 'http://';
            href = protocol + new URL(href, baseUrl).hostname + href;
          }

          // Handle protocol-relative URLs
          if (href.startsWith('//')) {
            const protocol = baseUrl.startsWith('https://')
              ? 'https:'
              : 'http:';
            href = protocol + href;
          }

          const fragment = href.split('/').pop().startsWith('#');
          if (fragment) {
            const arr = href.split('#');
            href = arr[0];
          }
          const includesHash =
            !href.split('/').pop().startsWith('#') &&
            href.split('/').pop().includes('#');
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

  const filteredUrls = hrefs.filter((href: any) => {
    const domain = new URL(baseUrl).hostname;
    return href !== null && href.startsWith(baseUrl);
  });
  return filteredUrls;
}
