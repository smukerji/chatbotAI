/**
 * WhatsApp QR Session Server
 *
 * Standalone Express + Baileys server. Deploy on GCP (Cloud Run, Compute Engine, etc.).
 * Connects to the same MongoDB Atlas instance as the Vercel Next.js app.
 *
 * Environment variables required:
 *   MONGO_URI            - MongoDB connection string
 *   MONGO_DB_NAME        - Database name (optional, defaults to default db in URI)
 *   PORT                 - HTTP port (default 3001)
 *   SERVER_SECRET        - Shared secret; Vercel app sends this in X-WA-Secret header
 *   NEXT_PUBLIC_WEBSITE_URL - Base URL of the Vercel app (used to call AI completion)
 *   NEXT_PUBLIC_OPENAI_KEY  - OpenAI API key for AI replies
 *
 * Run:
 *   node whatsapp-server.js
 */

"use strict";

require("dotenv").config({ path: ".env.local" });

const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const {
  default: makeWASocket,
  DisconnectReason,
  initAuthCreds,
  proto,
  isJidBroadcast,
  isJidGroup,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  Browsers,
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const QRCode = require("qrcode");

// ─── Config ───────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3001;
const MONGO_URI = process.env.MONGO_URI || process.env.NEXT_PUBLIC_MONGO_URI;
const MONGO_DB_NAME = process.env.MONGO_DB_NAME || null; // null = use db from URI
const SERVER_SECRET = process.env.SERVER_SECRET || "";
const OPENAI_KEY = process.env.NEXT_PUBLIC_OPENAI_KEY;
const PINECONE_BASE = process.env.NEXT_PUBLIC_WEBSITE_URL || "http://localhost:3000/";

if (!MONGO_URI) {
  console.error("MONGO_URI is required");
  process.exit(1);
}

// Safety net: a stray async error from a single WhatsApp socket should never
// take down the whole multi-tenant server. Log and keep running.
process.on("uncaughtException", (err) => {
  console.error("[uncaughtException]", err?.message ?? err);
});
process.on("unhandledRejection", (reason) => {
  console.error("[unhandledRejection]", reason?.message ?? reason);
});

// ─── MongoDB ──────────────────────────────────────────────────────────────────

let dbClient = null;
let db = null;

async function connectDb() {
  dbClient = new MongoClient(MONGO_URI);
  await dbClient.connect();
  db = MONGO_DB_NAME ? dbClient.db(MONGO_DB_NAME) : dbClient.db();
  console.log("✅ Connected to MongoDB");

  // Ensure indexes
  await db
    .collection("whatsapp_auth")
    .createIndex({ chatbotId: 1, key: 1 }, { unique: true });
  await db
    .collection("whatsapp_qr_sessions")
    .createIndex({ chatbotId: 1 }, { unique: true });
}

// ─── MongoDB auth state (per chatbotId) ───────────────────────────────────────

/**
 * MongoDB stores Buffer values as BSON Binary objects. Baileys expects plain
 * Buffer / Uint8Array. This helper recursively converts any Binary instance
 * back to a Buffer so the Baileys handshake/crypto code can consume them.
 */
function fixBuffers(obj) {
  if (obj == null) return obj;

  // BSON Binary (mongodb driver v4+): has a .buffer property that is a Buffer/Uint8Array
  if (obj._bsontype === "Binary" || (obj.buffer && obj.sub_type !== undefined)) {
    return Buffer.from(obj.buffer ?? obj.value());
  }

  // Plain Buffer / Uint8Array already fine
  if (Buffer.isBuffer(obj) || obj instanceof Uint8Array) return obj;

  if (Array.isArray(obj)) return obj.map(fixBuffers);

  if (typeof obj === "object") {
    const out = {};
    for (const k of Object.keys(obj)) out[k] = fixBuffers(obj[k]);
    return out;
  }

  return obj;
}

async function useMongoAuthState(chatbotId) {
  const col = db.collection("whatsapp_auth");

  const readData = async (key) => {
    const doc = await col.findOne({ chatbotId, key });
    // Convert any BSON Binary values back to Buffer before handing to Baileys
    return doc ? fixBuffers(doc.value) : null;
  };

  const writeData = (key, value) =>
    col.replaceOne(
      { chatbotId, key },
      { chatbotId, key, value },
      { upsert: true }
    );

  const removeData = (key) => col.deleteOne({ chatbotId, key });

  const creds = (await readData("creds")) || initAuthCreds();

  return {
    state: {
      creds,
      keys: {
        get: async (type, ids) => {
          const data = {};
          await Promise.all(
            ids.map(async (id) => {
              let value = await readData(`${type}-${id}`);
              if (type === "app-state-sync-key" && value) {
                value = proto.Message.AppStateSyncKeyData.fromObject(value);
              }
              data[id] = value;
            })
          );
          return data;
        },
        set: async (data) => {
          const tasks = [];
          for (const category of Object.keys(data)) {
            for (const id of Object.keys(data[category])) {
              const value = data[category][id];
              const fullKey = `${category}-${id}`;
              tasks.push(
                value ? writeData(fullKey, value) : removeData(fullKey)
              );
            }
          }
          await Promise.all(tasks);
        },
      },
    },
    saveCreds: () => writeData("creds", creds),
  };
}

// ─── In-memory session registry ───────────────────────────────────────────────

// chatbotId → { sock, chatbotId, userId, status, phoneNumber }
const sessions = new Map();

// ─── OpenAI client ───────────────────────────────────────────────────────────

const OpenAI = require("openai");
const openai = new OpenAI.default({
  apiKey: OPENAI_KEY,
  // Note: do NOT pass project/organization here — the whatsapp server uses the
  // plain API key only. Scoping to a project ID that doesn't own the key causes
  // 400 "Invalid project ID" errors on every OpenAI call.
});

// ─── Fetch with timeout ───────────────────────────────────────────────────────
// Tool-call fetches hit the Next.js app (pinecone, shopify, etc.). Without a
// timeout, a slow/stalled endpoint blocks the assistant run indefinitely,
// causing the whole run to hit the 120s wall. AbortController bounds each call.
async function fetchWithTimeout(url, options = {}, timeoutMs = 30_000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// ─── Token helpers ────────────────────────────────────────────────────────────
// Simple UTF-8 character-based token estimate (≈ 4 chars per token).
// Avoids pulling in gpt-tokenizer as a native dep on the GCP VM while keeping
// the history-trimming logic functionally equivalent to the Next.js webhook.
function estimateTokens(text) {
  if (!text) return 0;
  return Math.ceil(String(text).length / 4);
}

// ─── Timestamp helpers (mirrors route.ts) ─────────────────────────────────────

function createMessageWithTimestamp(role, content) {
  const now = new Date();
  return {
    role,
    content,
    timestamp: now.toISOString(),
    messageTime: now.toISOString().replace("T", " ").slice(0, 19),
  };
}

function cleanMessagesForOpenAI(messages) {
  return messages.map((m) => ({ role: m.role, content: m.content }));
}

// ─── Format helper (mirrors formatMessageForWhatsApp in route.ts) ─────────────

async function formatMessageForWhatsApp(text) {
  if (!text || !text.trim()) return text;
  // Only bother calling the formatter when the response looks like HTML
  if (!/<[a-z][\s\S]*>/i.test(text)) return text;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content:
              "Format provided content as pre whatsapp messaging style. Output ONLY the converted text without any extra notes.",
          },
          {
            role: "user",
            content: `Convert the following content for WhatsApp delivery. Output ONLY the converted text without any extra notes:\n\n${text}`,
          },
        ],
      }),
    });
    const body = await res.json();
    return body?.choices?.[0]?.message?.content?.trim() || text;
  } catch (err) {
    console.warn("[FORMAT] Could not format for WhatsApp, using raw text:", err.message);
    return text;
  }
}

// ─── Assistants-API helpers (used only by legacy bot paths) ──────────────────

async function createThread() {
  const thread = await openai.beta.threads.create();
  console.log(`[THREAD] Created ${thread.id}`);
  return thread;
}

async function addMessageToThread(threadId, message) {
  return openai.beta.threads.messages.create(threadId, {
    role: "user",
    content: message,
  });
}

// NOTE: runAssistant via beta.threads.runs is only valid for chatbots that have
// a real OpenAI asst_xxx ID. bot-v2 chatbots use the Responses API instead
// (see getResponsesAPIReply below).
async function runAssistant(threadId, assistantId) {
  return openai.beta.threads.runs.create(threadId, { assistant_id: assistantId });
}

// ─── Responses-API helper for bot-v2 (mirrors messages/route.ts) ─────────────

/**
 * Build the dynamic context injected into every turn's instructions.
 * Mirrors buildDynamicContext in messages/route.ts.
 */
function buildDynamicContext(businessTimezone) {
  const now = new Date();
  const isoNow = now.toISOString();
  const utcDate = now.toUTCString();
  const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const todayName = weekdays[now.getUTCDay()];
  const tomorrow = new Date(now);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const tomorrowISO = tomorrow.toISOString().slice(0, 10);

  let localNow = isoNow;
  try {
    localNow = new Intl.DateTimeFormat("en-CA", {
      timeZone: businessTimezone,
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      hour12: false,
    }).format(now).replace(",", "");
  } catch (_) { /* invalid tz — fall back to ISO */ }

  return `
## SYSTEM OVERRIDE — Dynamic Context (HIGHEST PRIORITY — these rules override all previous instructions)

CURRENT_DATETIME_UTC: ${isoNow}
CURRENT_DATETIME_LOCAL (${businessTimezone}): ${localNow}
CURRENT_DATE_HUMAN: ${utcDate}
TODAY_WEEKDAY: ${todayName}
TOMORROW_DATE: ${tomorrowISO}
BUSINESS_TIMEZONE: ${businessTimezone}

### CRITICAL BOOKING RULES — MUST follow exactly, no exceptions:

1. **NEVER ask for information already given.** Scan the ENTIRE conversation before asking anything.
2. **Extract ALL fields from a single message.** If the user provides all required fields in one message, proceed directly to calling the booking function.
3. **Resolve relative dates silently.** "tomorrow" = ${tomorrowISO}. "today" = ${isoNow.slice(0, 10)}.
4. **Resolve 12-hour times silently.** "6 pm" = 18:00, "2 pm" = 14:00.
5. **BUSINESS_TIMEZONE = "${businessTimezone}".** Use this for all bookings.
6. **dateTime format = "YYYY-MM-DDTHH:MM:SS".**
7. **After user confirms any field — move on.**
8. **The "ask one thing at a time" rule applies ONLY to genuinely missing fields.**
`.trim();
}

/**
 * Call the Responses API for bot-v2 chatbots (stateless, no asst_xxx needed).
 * Uses previous_response_id chaining stored in whatsapp-qr-chat-history for
 * conversation continuity, mirroring what messages/route.ts does for web chat.
 *
 * @param {string} userMessage
 * @param {object} chatbotDoc     - document from user-chatbots
 * @param {object} chatbotSettings - document from chatbot-settings
 * @param {string|null} previousResponseId - last response ID for this conversation
 * @returns {{ text: string, responseId: string }}
 */
async function getResponsesAPIReply(userMessage, chatbotDoc, chatbotSettings, previousResponseId) {
  const assistantType  = chatbotDoc.assistantType ?? "";
  const model          = chatbotSettings?.model ?? "gpt-4o";
  const temperature    = chatbotSettings?.temperature !== undefined ? chatbotSettings.temperature : 1;
  const businessTimezone = chatbotSettings?.bookingTimezone ?? "UTC";

  // Use instruction from settings if set; otherwise fall back to the type-based system prompt.
  // We keep this simple for whatsapp-server.js — the full prompt library lives in the Next.js app.
  const baseInstruction = chatbotSettings?.instruction ?? "";
  const dynamicContext  = buildDynamicContext(businessTimezone);
  const fullInstructions = baseInstruction
    ? `${baseInstruction}\n\n${dynamicContext}`
    : dynamicContext;

  // Derive tool definitions from assistantType.
  // This mirrors getAssistantTools() in assistant-creation-contants.ts.
  const tools = getToolsForAssistantType(assistantType, chatbotDoc.chatbotId);

  const responseParams = {
    model,
    instructions: fullInstructions,
    input: userMessage,
    ...(tools.length > 0 ? { tools } : {}),
    ...(previousResponseId ? { previous_response_id: previousResponseId } : {}),
    ...(!model.startsWith("o1") && !model.startsWith("o3")
      ? { temperature }
      : { reasoning: { effort: "medium" } }),
  };

  console.log(`[ResponsesAPI] model=${model} assistantType=${assistantType} prevRespId=${previousResponseId ?? "(none)"}`);

  const response = await openai.responses.create(responseParams);

  // Handle tool calls if any (single-pass for WhatsApp — no streaming)
  let finalResponse = response;
  let toolIterations = 0;
  const MAX_TOOL_ITERATIONS = 5;

  while (toolIterations < MAX_TOOL_ITERATIONS) {
    const functionCalls = (finalResponse.output || []).filter((o) => o.type === "function_call");
    if (functionCalls.length === 0) break;

    toolIterations++;
    console.log(`[ResponsesAPI][TOOLS] Processing ${functionCalls.length} tool call(s) — iteration ${toolIterations}`);

    const toolOutputs = await Promise.all(
      functionCalls.map(async (toolCall) => {
        const fnName = toolCall.name;
        let args = {};
        try { args = JSON.parse(toolCall.arguments); } catch (_) {}

        console.log(`[ResponsesAPI][TOOLS] → ${fnName} args=${JSON.stringify(args).slice(0, 200)}`);
        let output;
        try {
          if (fnName === "find_product") {
            const r = await fetchWithTimeout(`${PINECONE_BASE}api/integrations/shopify/products`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ product_name: args.query, chatbotId: chatbotDoc.chatbotId }),
            });
            output = r.ok
              ? JSON.stringify({ success: true, data: [{ source: "shopify store", content: await r.json() }] })
              : JSON.stringify({ success: false, message: "Shopify lookup failed" });
          } else if (fnName === "get_customer_orders") {
            const r = await fetchWithTimeout(`${PINECONE_BASE}api/integrations/shopify/orders`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: args.email, chatbotId: chatbotDoc.chatbotId }),
            });
            output = r.ok
              ? JSON.stringify({ success: true, data: [{ source: "shopify store", content: await r.json() }] })
              : JSON.stringify({ success: false, message: "Order lookup failed" });
          } else if (fnName === "get_products") {
            const r = await fetchWithTimeout(`${PINECONE_BASE}api/integrations/shopify/products?chatbotId=${chatbotDoc.chatbotId}`, {
              method: "GET",
            });
            output = r.ok
              ? JSON.stringify({ success: true, data: [{ source: "shopify store", content: await r.json() }] })
              : JSON.stringify({ success: false, message: "Products lookup failed" });
          } else if (fnName === "get_reference") {
            const r = await fetchWithTimeout(`${PINECONE_BASE}api/pinecone`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userQuery: args.userQuery, chatbotId: chatbotDoc.chatbotId, userId: chatbotDoc.userId }),
            });
            output = JSON.stringify({ success: true, data: r.ok ? await r.json() : [] });
          } else if (fnName === "get_search_results") {
            const r = await fetchWithTimeout(`${PINECONE_BASE}api/integrations/perplexity/sonar`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userQuery: args.userQuery }),
            });
            const d = r.ok ? await r.json() : {};
            output = JSON.stringify({ success: true, data: d.message, sources: d.sources });
          } else if (fnName === "ask_relevant_followup_questions") {
            output = JSON.stringify({ success: true });
          } else if (fnName === "create_booking") {
            const r = await fetchWithTimeout(`${PINECONE_BASE}api/integrations/booking/create`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...args, chatbotId: chatbotDoc.chatbotId }),
            });
            output = r.ok ? JSON.stringify(await r.json()) : JSON.stringify({ success: false, message: "Booking failed" });
          } else {
            output = JSON.stringify({ success: false, message: "This functionality will be available soon" });
          }
        } catch (err) {
          console.error(`[ResponsesAPI][TOOLS] ✗ ${fnName} failed:`, err.message);
          output = JSON.stringify({ success: false, message: err.message || "tool error" });
        }

        return { call_id: toolCall.call_id, output };
      })
    );

    // Submit tool outputs back to the Responses API
    finalResponse = await openai.responses.create({
      model,
      instructions: fullInstructions,
      ...(tools.length > 0 ? { tools } : {}),
      previous_response_id: finalResponse.id,
      input: toolOutputs.map((to) => ({
        type: "function_call_output",
        call_id: to.call_id,
        output: to.output,
      })),
      ...(!model.startsWith("o1") && !model.startsWith("o3")
        ? { temperature }
        : { reasoning: { effort: "medium" } }),
    });
  }

  // Extract text from the completed response
  const textOutput = (finalResponse.output || []).find((o) => o.type === "message");
  const text = (textOutput?.content || []).map((c) => c.text ?? "").join("") ?? "";

  return { text, responseId: finalResponse.id };
}

/**
 * Return Responses-API-shaped tool definitions for a given assistantType.
 * This is a lightweight mirror of getAssistantTools() from the TypeScript app.
 * Only tool shapes are defined here — the actual implementations are in the tool-call
 * handler above.
 */
function getToolsForAssistantType(assistantType, chatbotId) {
  const common = {
    get_reference: {
      type: "function",
      name: "get_reference",
      description: "Search the knowledge base for relevant information to answer the user query.",
      parameters: {
        type: "object",
        properties: { userQuery: { type: "string", description: "The user's question" } },
        required: ["userQuery"],
      },
    },
    ask_relevant_followup_questions: {
      type: "function",
      name: "ask_relevant_followup_questions",
      description: "Ask the user a clarifying follow-up question.",
      parameters: {
        type: "object",
        properties: { question: { type: "string" } },
        required: ["question"],
      },
    },
  };

  if (assistantType === "ecommerce-agent-shopify") {
    return [
      { type: "function", name: "find_product", description: "Find a product by name.", parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } },
      { type: "function", name: "get_customer_orders", description: "Get orders for a customer by email.", parameters: { type: "object", properties: { email: { type: "string" } }, required: ["email"] } },
      { type: "function", name: "get_products", description: "List all products.", parameters: { type: "object", properties: {} } },
      common.ask_relevant_followup_questions,
    ];
  }

  if (assistantType === "booking-agent") {
    return [
      {
        type: "function",
        name: "create_booking",
        description: "Create a booking for the customer.",
        parameters: {
          type: "object",
          properties: {
            customerName: { type: "string" },
            customerEmail: { type: "string" },
            customerPhone: { type: "string" },
            serviceType: { type: "string" },
            dateTime: { type: "string", description: "ISO 8601 format: YYYY-MM-DDTHH:MM:SS" },
            timezone: { type: "string" },
          },
          required: ["customerName", "customerEmail", "customerPhone", "serviceType", "dateTime", "timezone"],
        },
      },
      common.ask_relevant_followup_questions,
    ];
  }

  if (assistantType === "research-web") {
    return [
      {
        type: "function",
        name: "get_search_results",
        description: "Search the web for current information.",
        parameters: { type: "object", properties: { userQuery: { type: "string" } }, required: ["userQuery"] },
      },
      common.ask_relevant_followup_questions,
    ];
  }

  // All other types: knowledge-base reference + follow-up
  return [common.get_reference, common.ask_relevant_followup_questions];
}

/**
 * Cancel any runs left in a non-terminal state on this thread.
 * Previous attempts that timed out (e.g. Baileys socket drop) can leave the
 * thread wedged with an orphaned active run. Until that run is cancelled,
 * the thread rejects new messages ("while a run is active") and new runs
 * ("already has an active run"), so every subsequent message silently fails.
 * Clearing them first makes the flow self-healing.
 */
async function cancelActiveRuns(threadId) {
  try {
    const runs = await openai.beta.threads.runs.list(threadId, { limit: 10 });
    const activeStatuses = ["queued", "in_progress", "requires_action", "cancelling"];
    for (const run of runs.data) {
      if (activeStatuses.includes(run.status)) {
        console.warn(`[AI] Cancelling orphaned run ${run.id} (status=${run.status}) on thread ${threadId}`);
        try {
          await openai.beta.threads.runs.cancel(run.id, { thread_id: threadId });
        } catch (err) {
          console.warn(`[AI] Could not cancel run ${run.id}: ${err.message}`);
        }
      }
    }
    // Give OpenAI a moment to register the cancellation before we continue
    if (runs.data.some((r) => activeStatuses.includes(r.status))) {
      await new Promise((r) => setTimeout(r, 1_500));
    }
  } catch (err) {
    console.warn(`[AI] cancelActiveRuns failed for ${threadId}: ${err.message}`);
  }
}

/**
 * Handle tool/function calls emitted by the assistant run.
 * Mirrors handleRequiredAction in route.ts — routes each tool call to the
 * Next.js API endpoints (pinecone, shopify, etc.) and submits outputs back.
 */
async function handleRequiredAction(threadId, runId, chatbotId, userId, messages) {
  const run = await openai.beta.threads.runs.retrieve(runId, { thread_id: threadId });
  if (run.status !== "requires_action") return run;

  const toolCalls = run.required_action?.submit_tool_outputs?.tool_calls || [];
  console.log(`[TOOLS] Processing ${toolCalls.length} tool call(s) for run ${runId}`);

  const toolOutputs = await Promise.all(
    toolCalls.map(async (toolCall) => {
      const fnName = toolCall.function.name;
      let args = {};
      try { args = JSON.parse(toolCall.function.arguments); } catch (_) {}

      console.log(`[TOOLS] → ${fnName} args=${JSON.stringify(args).slice(0, 200)}`);
      const toolStart = Date.now();

      let output;
      try {
        if (fnName === "find_product") {
          const r = await fetchWithTimeout(`${PINECONE_BASE}api/integrations/shopify/products`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ product_name: args.query, chatbotId }),
          });
          output = r.ok
            ? JSON.stringify({ success: true, data: [{ source: "shopify store", content: await r.json() }] })
            : JSON.stringify({ success: false, message: "Shopify lookup failed" });

        } else if (fnName === "get_customer_orders") {
          const r = await fetchWithTimeout(`${PINECONE_BASE}api/integrations/shopify/orders`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: args.email, chatbotId }),
          });
          output = r.ok
            ? JSON.stringify({ success: true, data: [{ source: "shopify store", content: await r.json() }] })
            : JSON.stringify({ success: false, message: "Order lookup failed" });

        } else if (fnName === "get_products") {
          const r = await fetchWithTimeout(`${PINECONE_BASE}api/integrations/shopify/products?chatbotId=${chatbotId}`, {
            method: "GET",
          });
          output = r.ok
            ? JSON.stringify({ success: true, data: [{ source: "shopify store", content: await r.json() }] })
            : JSON.stringify({ success: false, message: "Products lookup failed" });

        } else if (fnName === "get_reference") {
          const r = await fetchWithTimeout(`${PINECONE_BASE}api/pinecone`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userQuery: args.userQuery, chatbotId, userId, messages }),
          });
          output = JSON.stringify({ success: true, data: r.ok ? await r.json() : [] });

        } else if (fnName === "get_search_results") {
          const r = await fetchWithTimeout(`${PINECONE_BASE}api/integrations/perplexity/sonar`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userQuery: args.userQuery }),
          });
          const d = r.ok ? await r.json() : {};
          output = JSON.stringify({ success: true, data: d.message, sources: d.sources });

        } else if (fnName === "ask_relevant_followup_questions") {
          output = JSON.stringify({ success: true });

        } else {
          output = JSON.stringify({ success: false, message: "This functionality will be available soon" });
        }
        console.log(`[TOOLS] ✓ ${fnName} done in ${Date.now() - toolStart}ms`);
      } catch (err) {
        // Always return an output (even on failure) so the run can resume
        // instead of hanging in requires_action until the 120s wall.
        console.error(`[TOOLS] ✗ ${fnName} failed after ${Date.now() - toolStart}ms:`, err.message);
        output = JSON.stringify({ success: false, message: err.message || "tool error" });
      }

      return { tool_call_id: toolCall.id, output };
    })
  );

  console.log(`[TOOLS] Submitting ${toolOutputs.length} output(s) for run ${runId}`);
  const submitted = await openai.beta.threads.runs.submitToolOutputs(runId, { thread_id: threadId, tool_outputs: toolOutputs });
  console.log(`[TOOLS] Submitted — run ${runId} now ${submitted.status}`);
  return submitted;
}

/**
 * Poll until the run reaches a terminal state, handling requires_action
 * the same way the Next.js webhook does.
 */
async function waitForRunCompletion(threadId, runId, chatbotId, userId, messages, maxWaitMs = 180_000) {
  const deadline = Date.now() + maxWaitMs;
  let checkInterval = 2_000;
  let pollCount = 0;

  while (Date.now() < deadline) {
    const run = await openai.beta.threads.runs.retrieve(runId, { thread_id: threadId });
    pollCount++;
    console.log(`[AI][${chatbotId}] run ${runId} poll #${pollCount} status=${run.status}`);

    if (run.status === "completed") return run;

    if (run.status === "requires_action") {
      await handleRequiredAction(threadId, runId, chatbotId, userId, messages);
      await new Promise((r) => setTimeout(r, 2_000));
      continue;
    }

    if (["failed", "cancelled", "expired"].includes(run.status)) {
      throw new Error(`Assistant run ${run.status}: ${run.last_error?.message || "unknown"}`);
    }

    await new Promise((r) => setTimeout(r, checkInterval));
    // Back off slightly for longer-running jobs
    if (checkInterval < 5_000) checkInterval = Math.min(checkInterval + 1_000, 5_000);
  }

  throw new Error(`Assistant run timed out after ${maxWaitMs}ms`);
}

/** Extract plain text from an OpenAI thread message (handles nested shapes). */
function extractMessageText(msg) {
  if (!msg) return null;
  if (typeof msg.content === "string") return msg.content;
  if (Array.isArray(msg.content) && msg.content.length > 0) {
    const c = msg.content[0];
    if (c?.text?.value) return c.text.value;
    if (typeof c?.text === "string") return c.text;
    if (typeof c === "string") return c;
  }
  return null;
}

// ─── Token-limit constants (mirrors route.ts) ─────────────────────────────────

const MODEL_TOKEN_LIMITS = {
  "gpt-3.5-turbo": 4_000,
  "gpt-4": 8_000,
  "gpt-4-turbo": 128_000,
  "gpt-4o": 128_000,
};

// ─── Core AI dispatch ─────────────────────────────────────────────────────────

/**
 * Get an AI reply for an incoming WhatsApp QR message.
 *
 * Mirrors the full logic in route.ts:
 *   - bot-v2  → OpenAI Responses API (stateless, no asst_xxx ID needed)
 *   - others  → Chat Completions API with Pinecone context + conversation history
 *
 * Also persists conversation history to the same `whatsapp-qr-chat-history`
 * MongoDB collection so chats are visible in the dashboard.
 *
 * @param {string} userMessage   - cleaned incoming message text
 * @param {string} chatbotId     - OpenAI assistant ID / chatbot ID
 * @param {string} userId        - owner user ID
 * @param {string} senderJid     - WhatsApp JID of the sender (used as conversation key)
 */
async function getAIReply(userMessage, chatbotId, userId, senderJid) {
  // ── 1. Load chatbot config ────────────────────────────────────────────────
  const [chatbotDoc, chatbotSettings] = await Promise.all([
    db.collection("user-chatbots").findOne({ chatbotId }),
    db.collection("chatbot-settings").findOne({ chatbotId }),
  ]);

  if (!chatbotDoc) throw new Error(`No chatbot found for chatbotId=${chatbotId}`);

  const botType        = chatbotDoc.botType;                         // "bot-v2" or legacy
  const model          = chatbotSettings?.model          || "gpt-3.5-turbo";
  const temperature    = chatbotSettings?.temperature    ?? 0;
  const instruction    = chatbotSettings?.instruction    || "";
  const useAssistantAPI = botType === "bot-v2";

  // ── 2. Chat history setup ─────────────────────────────────────────────────
  const historyCol = db.collection("whatsapp-qr-chat-history");
  // Use the bare JID phone number as the conversation key (strip @s.whatsapp.net / @g.us)
  const phoneKey = senderJid.split("@")[0];
  const dateKey  = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  // Store user message immediately (mirrors route.ts step 5.5)
  const userMsg = createMessageWithTimestamp("user", userMessage);

  let existingDoc = await historyCol.findOne({ userId, chatbotId, date: dateKey });

  // ── 2a. Ensure the history document + phone-key entry exist ──────────────
  if (!existingDoc) {
    const newDoc = {
      userId,
      chatbotId,
      chats: {
        [phoneKey]: {
          messages: [],
          usage: { completion_tokens: 0, prompt_tokens: 0, total_tokens: 0 },
        },
      },
      date: dateKey,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await historyCol.insertOne(newDoc);
    existingDoc = newDoc;
  } else if (!existingDoc.chats?.[phoneKey]) {
    await historyCol.updateOne(
      { userId, chatbotId, date: dateKey },
      {
        $set: {
          [`chats.${phoneKey}.messages`]: [],
          [`chats.${phoneKey}.usage`]: { completion_tokens: 0, prompt_tokens: 0, total_tokens: 0 },
          updatedAt: new Date(),
        },
      }
    );
    existingDoc.chats = existingDoc.chats || {};
    existingDoc.chats[phoneKey] = { messages: [], usage: { completion_tokens: 0, prompt_tokens: 0, total_tokens: 0 } };
  }

  // ── 2b. Handle per-path thread wiring for legacy bots ───────────────────
  // bot-v2 uses the Responses API (stateless) — no thread needed.
  // Legacy bots don't use threads either; this variable is kept for compatibility.
  let threadId = null;

  // Persist user message to history
  await historyCol.updateOne(
    { userId, chatbotId, date: dateKey },
    {
      $push: { [`chats.${phoneKey}.messages`]: userMsg },
      $set: { updatedAt: new Date() },
    }
  );

  // ── 3. Generate AI response ───────────────────────────────────────────────
  let aiResponse = "";
  let usage = { completion_tokens: 0, prompt_tokens: 0, total_tokens: 0 };

  if (useAssistantAPI) {
    // ── bot-v2: Responses API (stateless — no asst_xxx ID required) ───────
    console.log(`[AI][${chatbotId}] bot-v2 path — Responses API`);

    // Retrieve the previous response ID for conversation continuity
    const previousResponseId = existingDoc?.chats?.[phoneKey]?.previousResponseId ?? null;

    const { text, responseId } = await getResponsesAPIReply(
      userMessage,
      chatbotDoc,
      chatbotSettings,
      previousResponseId
    );

    aiResponse = text;

    // Persist the new response ID so the next turn can chain off it
    if (responseId) {
      await historyCol.updateOne(
        { userId, chatbotId, date: dateKey },
        { $set: { [`chats.${phoneKey}.previousResponseId`]: responseId, updatedAt: new Date() } }
      );
    }

    console.log(`[AI][${chatbotId}] Responses API done — responseLength=${aiResponse.length}`);

    usage = {
      completion_tokens: estimateTokens(aiResponse),
      prompt_tokens: estimateTokens(userMessage),
      total_tokens: estimateTokens(aiResponse) + estimateTokens(userMessage),
    };

  } else {
    // ── legacy bot: Chat Completions API with Pinecone + history ─────────
    console.log(`[AI][${chatbotId}] legacy path — model ${model}`);

    // 3a. Pinecone context
    let similarityResults = "";
    try {
      const pineconeRes = await fetch(`${PINECONE_BASE}api/pinecone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userQuery: userMessage, chatbotId, userId }),
      });
      if (pineconeRes.ok) {
        similarityResults = await pineconeRes.text();
      } else {
        console.warn(`[AI] Pinecone returned HTTP ${pineconeRes.status}`);
      }
    } catch (err) {
      console.warn("[AI] Pinecone failed, proceeding without context:", err.message);
    }

    // 3b. Build conversation history respecting token limits
    const previousMessages = (existingDoc?.chats?.[phoneKey]?.messages || []).slice(0, -1); // exclude current user msg we just pushed
    const previousTotalTokens = existingDoc?.chats?.[phoneKey]?.usage?.total_tokens || 0;
    const tokenLimit = MODEL_TOKEN_LIMITS[model] || 4_000;

    let conversationMessages = [...previousMessages];
    let usedTokens =
      previousTotalTokens +
      estimateTokens(userMessage) +
      estimateTokens(similarityResults);

    // Trim oldest messages until we're under the limit
    while (usedTokens > tokenLimit && conversationMessages.length > 0) {
      const removed = conversationMessages.shift();
      usedTokens -= estimateTokens(removed?.content || "");
    }

    // 3c. OpenAI Chat Completions call
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model,
        temperature,
        top_p: 1,
        messages: [
          {
            role: "system",
            content: `${instruction}\n\ncontext:\n${similarityResults}`,
          },
          ...cleanMessagesForOpenAI(conversationMessages),
          { role: "user", content: `query: ${userMessage}` },
        ],
      }),
    });

    const openaiBody = await openaiRes.json();
    if (!openaiRes.ok) {
      throw new Error(`OpenAI error ${openaiRes.status}: ${JSON.stringify(openaiBody)}`);
    }
    aiResponse = openaiBody.choices?.[0]?.message?.content || "";
    usage = openaiBody.usage || usage;
  }

  if (!aiResponse) return "Sorry, I could not generate a reply.";

  // ── 4. Persist assistant message + update token usage ────────────────────
  const assistantMsg = createMessageWithTimestamp("assistant", aiResponse);

  await historyCol.updateOne(
    { userId, chatbotId, date: dateKey },
    {
      $push: { [`chats.${phoneKey}.messages`]: assistantMsg },
      $inc: {
        [`chats.${phoneKey}.usage.completion_tokens`]: usage.completion_tokens || 0,
        [`chats.${phoneKey}.usage.prompt_tokens`]:    usage.prompt_tokens    || 0,
        [`chats.${phoneKey}.usage.total_tokens`]:     usage.total_tokens     || 0,
      },
      $set: { updatedAt: new Date() },
    }
  );

  // ── 5. Update global message count ───────────────────────────────────────
  await db
    .collection("user-details")
    .updateOne({ userId }, { $inc: { totalMessageCount: 1 } });

  // ── 6. Format HTML → WhatsApp-friendly plain text ────────────────────────
  return formatMessageForWhatsApp(aiResponse);
}

// ─── Async message handler (runs detached from Baileys event loop) ───────────
//
// The Baileys messages.upsert event handler must return synchronously.
// Awaiting AI work (OpenAI Assistants polling can take 30-120s) inside it
// blocks the Node event loop, preventing Baileys from sending WebSocket
// keepalive frames — which causes the socket to time out at 60s.
// This function is called fire-and-forget from the event handler.

async function handleIncomingMessage({ msg, isGroup, userMessage, chatbotId, sock }) {
  try {
    const chatbotDoc = await db
      .collection("user-chatbots")
      .findOne({ chatbotId });

    if (!chatbotDoc) {
      console.warn(`[MSG] No chatbot found for chatbotId=${chatbotId}`);
      return;
    }

    // senderJid: participant JID for groups, remoteJid for 1-1
    const senderJid = isGroup
      ? (msg.key.participant || msg.key.remoteJid)
      : msg.key.remoteJid;

    const reply = await getAIReply(userMessage, chatbotId, chatbotDoc.userId, senderJid);

    // null means a duplicate active-run was detected — skip sending
    if (reply === null) return;

    // In groups, @tag the sender and quote their message so the reply is
    // both threaded and notifies them directly.
    let sent;
    if (isGroup) {
      // Mention text must be "@<number>" where number is the JID's id part
      // (works for both phone "...@s.whatsapp.net" and LID "...@lid").
      const senderTag = senderJid.split(/[:@]/)[0];
      sent = await sock.sendMessage(msg.key.remoteJid, {
        text: `@${senderTag} ${reply}`,
        mentions: [senderJid],
        quoted: msg,
      });
    } else {
      sent = await sock.sendMessage(msg.key.remoteJid, { text: reply });
    }

    // Remember the message we just sent so it can be re-served to WhatsApp
    // if the recipient's device requests a re-send (decryption retry).
    const session = sessions.get(chatbotId);
    if (sent?.key?.id && sent.message && session?.rememberMessage) {
      session.rememberMessage(sent.key, sent.message);
    }

    await db
      .collection("whatsapp_qr_sessions")
      .updateOne({ chatbotId }, { $set: { lastActivity: new Date() } });

  } catch (err) {
    console.error(`[MSG] Error handling message for ${chatbotId}:`, err.message);
  }
}

// ─── Baileys session factory ───────────────────────────────────────────────────

async function startSession(chatbotId, userId) {
  // Close any existing socket but keep auth — a reconnect (e.g. after the
  // post-pairing 515 restart) must preserve the freshly-saved credentials.
  teardownSocket(chatbotId);

  // Register a placeholder session synchronously so status polls during the
  // async bootstrap below see "initializing" instead of the stale DB "disconnected".
  const session = { sock: null, chatbotId, userId, status: "initializing", phoneNumber: null };
  sessions.set(chatbotId, session);

  // Bounded in-memory store of recently sent/received messages, keyed by
  // message id. WhatsApp asks the sender to RE-SEND a message when the
  // recipient's device can't decrypt it (the "Waiting for this message"
  // state). Baileys fulfils that retry via the getMessage callback below —
  // without a message store the retry fails and the recipient stays stuck.
  const messageStore = new Map();
  const MESSAGE_STORE_LIMIT = 1_000;
  const rememberMessage = (key, message) => {
    if (!key?.id || !message) return;
    if (messageStore.size >= MESSAGE_STORE_LIMIT) {
      // Drop the oldest entry (Map preserves insertion order)
      messageStore.delete(messageStore.keys().next().value);
    }
    messageStore.set(key.id, message);
  };
  session.rememberMessage = rememberMessage;

  const logger = pino({ level: "silent" });
  const { state, saveCreds } = await useMongoAuthState(chatbotId);

  // Resolve the bot's own LID (privacy id used for group mentions). It is NOT
  // reliably present on sock.user.lid after every reconnect, so seed it from
  // the persisted auth creds and the session doc, then refresh it whenever a
  // fresh value appears. Without it, group @mentions of the bot can't be
  // matched and the bot silently ignores them.
  const persistedSessionDoc = await db
    .collection("whatsapp_qr_sessions")
    .findOne({ chatbotId });
  session.botLid =
    (state.creds?.me?.lid || "").split(/[:@]/)[0] ||
    persistedSessionDoc?.botLid ||
    null;

  // Always use the current WhatsApp Web protocol version — a stale version
  // causes the server to reject the handshake with code 405 before any QR.
  const { version } = await fetchLatestBaileysVersion();
  console.log(`[${chatbotId}] Using WA version ${version.join(".")}`);

  const sock = makeWASocket({
    version,
    logger,
    auth: {
      creds: state.creds,
      // Cache signal keys in memory on top of the Mongo store. This keeps
      // encryption keys consistent across rapid send/receive and is the
      // recommended setup for reliable group/E2E message delivery.
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    printQRInTerminal: false,
    browser: Browsers.ubuntu("Chrome"),
    defaultQueryTimeoutMs: 120_000,
    msgRetryCounterMap: {},
    shouldIgnoreJid: (jid) => isJidBroadcast(jid),
    // Required for reliable delivery: supplies the original message content
    // when WhatsApp requests a re-send for an undecryptable message.
    getMessage: async (key) => {
      const cached = messageStore.get(key?.id);
      return cached || proto.Message.fromObject({});
    },
  });

  // Swallow low-level WebSocket errors so a single socket fault can't crash the
  // whole multi-tenant process. Connection lifecycle is handled via
  // connection.update below.
  sock.ws?.on?.("error", (err) => {
    console.warn(`[${chatbotId}] socket error: ${err?.message ?? err}`);
  });

  session.sock = sock;

  // ── connection.update ──────────────────────────────────────────────────────
  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      // Render QR to a data URL so the browser can display it directly
      try {
        const qrDataUrl = await QRCode.toDataURL(qr, { width: 280, margin: 2 });
        session.status = "qr_generated";
        session.qrDataUrl = qrDataUrl;

        await db.collection("whatsapp_qr_sessions").updateOne(
          { chatbotId },
          {
            $set: {
              chatbotId,
              userId,
              status: "qr_generated",
              qrDataUrl,
              qrGeneratedAt: new Date(),
              updatedAt: new Date(),
            },
          },
          { upsert: true }
        );
      } catch (err) {
        console.error(`[QR] Render error for ${chatbotId}:`, err.message);
      }
    }

    if (connection === "open") {
      const phoneNumber = sock.user?.id?.split(/[:@]/)[0] || null;
      // Capture the bot's LID from whatever source has it this session, falling
      // back to any value we already cached/persisted.
      const freshLid =
        (sock.user?.lid || sock.authState?.creds?.me?.lid || "").split(/[:@]/)[0] || null;
      const botLid = freshLid || session.botLid || null;

      session.status = "connected";
      session.phoneNumber = phoneNumber;
      session.botLid = botLid;
      session.qrDataUrl = null;

      await db.collection("whatsapp_qr_sessions").updateOne(
        { chatbotId },
        {
          $set: {
            status: "connected",
            phoneNumber,
            botLid, // persist so future reconnects can match mentions
            connectedAt: new Date(),
            updatedAt: new Date(),
          },
          $unset: { qrDataUrl: "" },
        },
        { upsert: true }
      );
      console.log(`✅ [${chatbotId}] Connected as ${phoneNumber} (lid=${botLid})`);
    }

    if (connection === "close") {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const loggedOut = statusCode === DisconnectReason.loggedOut;
      // 405 = WhatsApp rejected the handshake (bad version/fingerprint or stale
      // auth). Reconnecting in a loop just repeats it, so treat it as fatal:
      // clear auth and stop so the next manual start gets a clean QR.
      const fatalHandshake = statusCode === 405;
      // 440 = connectionReplaced — another WhatsApp Web session (phone multi-device
      // or another server instance) took over this slot. Reconnecting just gets
      // kicked again immediately. Treat as fatal: stop and let the user re-scan.
      const connectionReplaced = statusCode === 440;

      session.status = "disconnected";

      await db.collection("whatsapp_qr_sessions").updateOne(
        { chatbotId },
        {
          $set: {
            status: "disconnected",
            disconnectedAt: new Date(),
            updatedAt: new Date(),
            lastDisconnectReason: lastDisconnect?.error?.message || "unknown",
          },
        }
      );

      sessions.delete(chatbotId);

      if (loggedOut || fatalHandshake || connectionReplaced) {
        // Clear stored auth so next start forces a fresh QR
        await db.collection("whatsapp_auth").deleteMany({ chatbotId });
        console.log(
          `🔒 [${chatbotId}] ${loggedOut ? "Logged out" : fatalHandshake ? "Handshake rejected (405)" : "Connection replaced (440) — another session took over"} — auth cleared, re-scan QR to reconnect`
        );
      } else {
        // Auto-reconnect after 5s for unexpected transient disconnects
        console.log(`🔄 [${chatbotId}] Reconnecting in 5s (code ${statusCode})…`);
        setTimeout(() => startSession(chatbotId, userId), 5_000);
      }
    }
  });

  // ── creds.update ──────────────────────────────────────────────────────────
  sock.ev.on("creds.update", saveCreds);

  // ── messages.upsert ───────────────────────────────────────────────────────
  sock.ev.on("messages.upsert", ({ messages: msgs, type }) => {
    // Return synchronously so Baileys can keep processing frames.
    // All async AI work runs in a detached promise — errors are caught inside.
    if (type !== "notify") return;

    for (const msg of msgs) {
      // Remember every inbound message so it can be served back to WhatsApp
      // if a re-send (decryption retry) is requested for it.
      if (msg.key?.id && msg.message) session.rememberMessage(msg.key, msg.message);

      // Skip outbound and broadcast messages
      if (msg.key.fromMe) continue;
      if (isJidBroadcast(msg.key.remoteJid)) continue;

      const isGroup = isJidGroup(msg.key.remoteJid);

      // Extract the text body — works for plain messages and quoted replies
      const rawText =
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        msg.message?.imageMessage?.caption ||
        msg.message?.videoMessage?.caption ||
        "";

      // Debug log for every inbound message so group issues are visible in pm2 logs
      if (isGroup) {
        console.log(`[GROUP][${chatbotId}] inbound — jid=${msg.key.remoteJid} participant=${msg.key.participant} rawText="${rawText.slice(0, 80)}" msgKeys=${Object.keys(msg.message || {}).join(",")}`);
      }

      if (!rawText.trim()) continue;

      // In group chats, only respond when the bot's number is @mentioned.
      // This prevents the bot from replying to every message in every group.
      if (isGroup) {
        // WhatsApp addresses group participants/mentions by either the phone
        // JID ("...@s.whatsapp.net") or the newer privacy LID ("...@lid").
        // The mention JID for this bot can be EITHER, so match against both.
        // session.botLid is the persisted/cached LID — more reliable than
        // sock.user.lid, which is often empty after a reconnect/restore.
        const botNumber = (sock.user?.id || "").split(/[:@]/)[0];
        const botLid =
          session.botLid ||
          (sock.user?.lid || sock.authState?.creds?.me?.lid || "").split(/[:@]/)[0] ||
          "";

        const mentionedJids =
          msg.message?.extendedTextMessage?.contextInfo?.mentionedJid ||
          msg.message?.imageMessage?.contextInfo?.mentionedJid ||
          msg.message?.videoMessage?.contextInfo?.mentionedJid ||
          [];

        const isMentioned = mentionedJids.some((jid) => {
          const id = jid.split(/[:@]/)[0]; // bare number/lid before @ or :
          return (botNumber && id === botNumber) || (botLid && id === botLid);
        });

        // Fallback: some clients send the mention without a mentionedJid entry
        // (e.g. as a plain "conversation" with the number wrapped in unicode
        // isolate markers U+2068/U+2069). Detect it by checking whether the
        // text contains "@" and the bot's phone-number digits.
        const textDigits = rawText.replace(/\D/g, "");
        const mentionedByText =
          rawText.includes("@") &&
          botNumber.length > 0 &&
          textDigits.includes(botNumber);

        const mentioned = isMentioned || mentionedByText;

        console.log(`[GROUP][${chatbotId}] mention check — botNumber=${botNumber} botLid=${botLid} mentionedJids=${JSON.stringify(mentionedJids)} jidMatch=${isMentioned} textMatch=${mentionedByText}`);

        if (!mentioned) continue;
      }

      // Clean the message text before sending to the AI: drop the @mention of
      // the bot in all its forms — "@<digits>", "@<lid>", and the formatted
      // "@⁨+852 5392 2699⁩" with unicode isolate markers (U+2068/U+2069).
      const userMessage = rawText
        .replace(/[\u2066-\u2069]/g, "")       // strip directional isolate markers
        .replace(/@\s*\+?[\d\s]+/g, " ")        // strip "@ +852 5392 2699" / "@123"
        .replace(/\s{2,}/g, " ")                 // collapse double spaces
        .trim();
      if (!userMessage) continue;

      // ── Fire-and-forget: never await inside the Baileys event handler.
      // Awaiting here blocks the Node event loop and prevents Baileys from
      // sending keepalive frames, causing the socket to time out at 60s.
      handleIncomingMessage({ msg, isGroup, userMessage, chatbotId, sock }).catch((err) => {
        console.error(`[MSG] Unhandled error for ${chatbotId}:`, err.message);
      });
    }
  });

  return session;
}

/** Close the in-memory socket and drop it from the registry. Keeps auth intact. */
function teardownSocket(chatbotId) {
  const session = sessions.get(chatbotId);
  if (!session) return;
  sessions.delete(chatbotId);

  const sock = session.sock;
  if (!sock) return;

  try {
    // A half-open ws (still CONNECTING) emits an async 'error' event when closed.
    // Attach a no-op listener first so it can't crash the process as an
    // unhandled error, then detach Baileys event listeners and close.
    sock.ws?.on?.("error", () => {});
    sock.ev?.removeAllListeners?.("connection.update");
    sock.ev?.removeAllListeners?.("creds.update");
    sock.ev?.removeAllListeners?.("messages.upsert");
    sock.end(undefined);
  } catch (_) {
    // ignore close errors
  }
}

/** User-initiated disconnect: close socket, mark disconnected, and clear auth. */
async function stopSession(chatbotId) {
  teardownSocket(chatbotId);

  await db.collection("whatsapp_qr_sessions").updateOne(
    { chatbotId },
    {
      $set: {
        status: "disconnected",
        disconnectedAt: new Date(),
        updatedAt: new Date(),
      },
    }
  );

  // Clear auth so next connect starts fresh with a new QR
  await db.collection("whatsapp_auth").deleteMany({ chatbotId });
  console.log(`🗑️  [${chatbotId}] Session stopped and auth cleared`);
}

// ─── Restore sessions on startup ─────────────────────────────────────────────

async function restoreSessions() {
  const connected = await db
    .collection("whatsapp_qr_sessions")
    .find({ status: "connected" })
    .toArray();

  console.log(`🔁 Restoring ${connected.length} connected session(s)…`);
  for (const doc of connected) {
    try {
      await startSession(doc.chatbotId, doc.userId);
    } catch (err) {
      console.error(`[RESTORE] Failed for ${doc.chatbotId}:`, err.message);
    }
  }
}

// ─── Express app ─────────────────────────────────────────────────────────────

const app = express();
app.use(express.json());

// Simple shared-secret auth middleware
app.use((req, res, next) => {
  if (!SERVER_SECRET) return next(); // no secret configured → open (not recommended in prod)
  const provided = req.headers["x-wa-secret"];
  if (provided !== SERVER_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
});

// Health check
app.get("/health", (_req, res) => res.json({ ok: true }));

/**
 * POST /wa-qr/start/:chatbotId
 * Body: { userId }
 * Kicks off a Baileys session and returns immediately.
 * The frontend then polls GET /wa-qr/status/:chatbotId every few seconds.
 * If a session is already connected, returns that status right away.
 */
app.post("/wa-qr/start/:chatbotId", async (req, res) => {
  const { chatbotId } = req.params;
  const { userId } = req.body;

  if (!userId) return res.status(400).json({ error: "userId is required" });

  try {
    // Already connected in memory — return immediately
    const existing = sessions.get(chatbotId);
    if (existing && existing.status === "connected") {
      return res.json({
        status: "connected",
        phoneNumber: existing.phoneNumber,
        message: "Already connected",
      });
    }

    // If a QR is already waiting in memory, return it immediately
    if (existing && existing.status === "qr_generated" && existing.qrDataUrl) {
      return res.json({ status: "qr_generated", qrDataUrl: existing.qrDataUrl });
    }

    // Start the session asynchronously — do NOT await it
    startSession(chatbotId, userId).catch((err) => {
      console.error(`[START] Error for ${chatbotId}:`, err.message);
    });

    // Return immediately — client will poll /status
    return res.json({ status: "starting", message: "Session starting, poll /status for QR" });
  } catch (err) {
    console.error(`[START] Unhandled error for ${chatbotId}:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /wa-qr/status/:chatbotId
 * Returns current session status. The frontend polls this every 2.5s.
 * Returns: { status, qrDataUrl?, phoneNumber? }
 */
app.get("/wa-qr/status/:chatbotId", async (req, res) => {
  const { chatbotId } = req.params;

  try {
    const session = sessions.get(chatbotId);
    // Persisted state — needed both for just-restarted servers and to resolve
    // the transient "initializing" window while a restored session reconnects.
    const doc = await db
      .collection("whatsapp_qr_sessions")
      .findOne({ chatbotId });

    if (session) {
      // During restore the session is briefly "initializing" with no phone
      // number yet. If the persisted state says it was connected, surface
      // "connected" so the UI shows the connected/edit state immediately
      // instead of falling back to "Connect".
      if (session.status === "initializing" && doc?.status === "connected") {
        return res.json({
          status: "connected",
          qrDataUrl: null,
          phoneNumber: doc.phoneNumber || null,
        });
      }
      return res.json({
        status: session.status,
        qrDataUrl: session.qrDataUrl || null,
        phoneNumber: session.phoneNumber || doc?.phoneNumber || null,
      });
    }

    // No in-memory session — fall back to persisted state
    if (!doc) return res.json({ status: "disconnected" });

    return res.json({
      status: doc.status,
      qrDataUrl: null, // QR URLs are ephemeral; after restart must call /start again
      phoneNumber: doc.phoneNumber || null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /wa-qr/disconnect/:chatbotId
 * Disconnects the session and clears auth state.
 */
app.delete("/wa-qr/disconnect/:chatbotId", async (req, res) => {
  const { chatbotId } = req.params;
  try {
    await stopSession(chatbotId);
    res.json({ message: "Disconnected" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Start ────────────────────────────────────────────────────────────────────

(async () => {
  try {
    await connectDb();
    await restoreSessions();
    app.listen(PORT, () => {
      console.log(`🚀 WhatsApp QR server listening on port ${PORT}`);
    });
  } catch (err) {
    console.error("Fatal startup error:", err);
    process.exit(1);
  }
})();
