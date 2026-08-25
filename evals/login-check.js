/**
 * Verifies the eval account can log in through the real UI, and saves the
 * authenticated storage state so later runs skip the login flow.
 *
 * Credentials come from .env.local (EVAL_EMAIL / EVAL_PASSWORD) — never inline.
 *
 * node evals/login-check.js            # headless
 * node evals/login-check.js --headed   # watch it
 */
require("dotenv").config({ path: ".env.local" });
const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

const BASE = process.env.EVAL_BASE || "http://localhost:3000";
const HEADED = process.argv.includes("--headed");
const STATE = path.join(__dirname, ".auth", "state.json");
const SHOTS = path.join(__dirname, "artifacts");

(async () => {
  if (!process.env.EVAL_EMAIL || !process.env.EVAL_PASSWORD) {
    console.log("EVAL_EMAIL / EVAL_PASSWORD missing from .env.local");
    process.exit(1);
  }
  fs.mkdirSync(path.dirname(STATE), { recursive: true });
  fs.mkdirSync(SHOTS, { recursive: true });

  const browser = await chromium.launch({ headless: !HEADED });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  const shot = async (name) => {
    const p = path.join(SHOTS, `login-${name}.png`);
    await page.screenshot({ path: p, fullPage: false });
    return p;
  };

  try {
    await page.goto(`${BASE}/account/login`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(2000);
    console.log("login page:", page.url());
    await shot("01-page");

    // the form markup varies; try the usual selectors in order
    const emailSel = ['input[name="email"]', 'input[type="email"]', '#email', 'input[placeholder*="mail" i]'];
    const passSel = ['input[name="password"]', 'input[type="password"]', '#password'];
    const findFirst = async (sels) => {
      for (const s of sels) {
        const el = page.locator(s).first();
        if (await el.count()) return el;
      }
      return null;
    };

    const email = await findFirst(emailSel);
    const pass = await findFirst(passSel);
    if (!email || !pass) {
      console.log("could not find the login inputs. inputs present on page:");
      const all = await page.locator("input").all();
      for (const i of all) {
        console.log("   ", await i.getAttribute("type"), await i.getAttribute("name"), await i.getAttribute("placeholder"));
      }
      await shot("02-no-inputs");
      throw new Error("login form not recognised");
    }

    await email.fill(process.env.EVAL_EMAIL);
    await pass.fill(process.env.EVAL_PASSWORD);
    await shot("02-filled");

    const submit = page.locator('button[type="submit"], button:has-text("Log in"), button:has-text("Login"), button:has-text("Sign in")').first();
    await submit.click();

    await page.waitForTimeout(6000);
    await shot("03-after-submit");

    const cookies = await ctx.cookies();
    const names = cookies.map((c) => c.name);
    const authCookie = cookies.find((c) => c.name === "authorization");
    console.log("submitted   :", page.url());
    console.log("cookies     :", names.join(", ") || "(none)");
    console.log("authorization cookie:", authCookie ? `present (${authCookie.value.length} chars)` : "ABSENT");

    /// the real test: can we load a page that requires auth and see our data
    await page.goto(`${BASE}/chatbot`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(8000);
    await shot("04-chatbot-list");

    const url = page.url();
    const bodyText = (await page.locator("body").innerText().catch(() => "")) || "";
    const sawOwnBot = /Customer Support|korea-hotel|IT-policy|RAGn8n|Pricing-csv/i.test(bodyText);
    const bouncedToLogin = url.includes("login");
    const authed = !!authCookie && !bouncedToLogin && sawOwnBot;

    console.log("protected page:", url);
    console.log("own chatbots visible:", sawOwnBot);
    if (!sawOwnBot) console.log("body preview:", bodyText.replace(/\s+/g, " ").slice(0, 300) || "(empty)");
    console.log(authed ? "LOGIN OK" : "LOGIN FAILED");

    if (authed) {
      await ctx.storageState({ path: STATE });
      console.log("saved auth state ->", STATE);
    } else {
      const err = await page.locator('text=/invalid|incorrect|not found|error/i').first();
      if (await err.count()) console.log("page message:", (await err.textContent())?.trim().slice(0, 200));
    }
    console.log("screenshots ->", SHOTS);
    process.exit(authed ? 0 : 1);
  } catch (e) {
    console.log("FAILED:", e.message.slice(0, 300));
    await shot("99-error").catch(() => {});
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
