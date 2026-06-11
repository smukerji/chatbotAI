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

// ─── AI reply helper ──────────────────────────────────────────────────────────

async function getAIReply(userMessage, chatbotId, userId) {
  try {
    // 1. Pinecone similarity search (calls the Next.js API)
    const pineconeRes = await fetch(`${PINECONE_BASE}api/pinecone`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userQuery: userMessage, chatbotId, userId }),
    });

    let similarityResults = "";
    if (pineconeRes.ok) {
      try {
        // The pinecone route returns an array of { content, source, filename, score, ... }
        const chunks = await pineconeRes.json();
        if (Array.isArray(chunks)) {
          similarityResults = chunks
            .map((c) => c.content || "")
            .filter(Boolean)
            .join("\n\n");
        }
      } catch (parseErr) {
        console.warn(`[AI] Could not parse Pinecone response, proceeding without context:`, parseErr.message);
      }
    } else {
      console.warn(`[AI] Pinecone returned HTTP ${pineconeRes.status}, proceeding without context`);
    }

    // 2. OpenAI completion
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        temperature: 0.5,
        messages: [
          {
            role: "system",
            content: `Use the following context to answer the user's question. If you don't know, say so.
Context:
${similarityResults}`,
          },
          { role: "user", content: userMessage },
        ],
      }),
    });
    const openaiBody = await openaiRes.json();
    return openaiBody.choices?.[0]?.message?.content || "Sorry, I could not generate a reply.";
  } catch (err) {
    console.error(`[AI] Error for chatbot ${chatbotId}:`, err.message);
    return "Sorry, something went wrong. Please try again.";
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

  const logger = pino({ level: "silent" });
  const { state, saveCreds } = await useMongoAuthState(chatbotId);

  // Always use the current WhatsApp Web protocol version — a stale version
  // causes the server to reject the handshake with code 405 before any QR.
  const { version } = await fetchLatestBaileysVersion();
  console.log(`[${chatbotId}] Using WA version ${version.join(".")}`);

  const sock = makeWASocket({
    version,
    logger,
    auth: state,
    printQRInTerminal: false,
    browser: Browsers.ubuntu("Chrome"),
    defaultQueryTimeoutMs: 60_000,
    msgRetryCounterMap: {},
    shouldIgnoreJid: (jid) => isJidBroadcast(jid),
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
      const phoneNumber = sock.user?.id?.split(":")[0] || null;
      session.status = "connected";
      session.phoneNumber = phoneNumber;
      session.qrDataUrl = null;

      await db.collection("whatsapp_qr_sessions").updateOne(
        { chatbotId },
        {
          $set: {
            status: "connected",
            phoneNumber,
            connectedAt: new Date(),
            updatedAt: new Date(),
          },
          $unset: { qrDataUrl: "" },
        },
        { upsert: true }
      );
      console.log(`✅ [${chatbotId}] Connected as ${phoneNumber}`);
    }

    if (connection === "close") {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const loggedOut = statusCode === DisconnectReason.loggedOut;
      // 405 = WhatsApp rejected the handshake (bad version/fingerprint or stale
      // auth). Reconnecting in a loop just repeats it, so treat it as fatal:
      // clear auth and stop so the next manual start gets a clean QR.
      const fatalHandshake = statusCode === 405;

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

      if (loggedOut || fatalHandshake) {
        // Clear stored auth so next start forces a fresh QR
        await db.collection("whatsapp_auth").deleteMany({ chatbotId });
        console.log(
          `🔒 [${chatbotId}] ${loggedOut ? "Logged out" : "Handshake rejected (405)"} — auth cleared`
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
  sock.ev.on("messages.upsert", async ({ messages: msgs, type }) => {
    if (type !== "notify") return;

    for (const msg of msgs) {
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

      if (!rawText.trim()) continue;

      // In group chats, only respond when the bot's number is @mentioned.
      // This prevents the bot from replying to every message in every group.
      if (isGroup) {
        const botNumber = sock.user?.id?.split(":")[0]; // e.g. "15551234567"
        const mentionedJids = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        const isMentioned =
          botNumber &&
          mentionedJids.some((jid) => jid.startsWith(botNumber));

        if (!isMentioned) continue;

        // Strip the @mention tag from the message before sending to AI
        // so the model doesn't see a raw JID in the query
      }

      // Clean the message text (remove @mention tags like @15551234567)
      const userMessage = rawText.replace(/@\d+/g, "").trim();
      if (!userMessage) continue;

      try {
        // Look up userId for this chatbot
        const chatbotDoc = await db
          .collection("user-chatbots")
          .findOne({ chatbotId });

        if (!chatbotDoc) {
          console.warn(`[MSG] No chatbot found for chatbotId=${chatbotId}`);
          continue;
        }

        const reply = await getAIReply(userMessage, chatbotId, chatbotDoc.userId);

        // In groups, quote the original message so the reply is threaded correctly
        if (isGroup) {
          await sock.sendMessage(msg.key.remoteJid, {
            text: reply,
            quoted: msg,
          });
        } else {
          await sock.sendMessage(msg.key.remoteJid, { text: reply });
        }

        // Update last activity
        await db
          .collection("whatsapp_qr_sessions")
          .updateOne({ chatbotId }, { $set: { lastActivity: new Date() } });
      } catch (err) {
        console.error(`[MSG] Error handling message for ${chatbotId}:`, err.message);
      }
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
    // In-memory is authoritative; fall back to DB for just-restarted server
    const session = sessions.get(chatbotId);
    if (session) {
      return res.json({
        status: session.status,
        qrDataUrl: session.qrDataUrl || null,
        phoneNumber: session.phoneNumber || null,
      });
    }

    // Check DB in case server just restarted
    const doc = await db
      .collection("whatsapp_qr_sessions")
      .findOne({ chatbotId });

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
