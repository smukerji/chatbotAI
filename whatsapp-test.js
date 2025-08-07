const {
  default: makeWASocket,
  proto,
  DisconnectReason,
  downloadMediaMessage,
  isJidBroadcast,
  initAuthCreds,
} = require("@whiskeysockets/baileys");
const { Boom } = require("@hapi/boom");
const pino = require("pino");
const qrcode = require("qrcode-terminal");
const { MongoClient } = require("mongodb");

// Logger configuration
const logger = pino({ level: "silent" });

// Custom Auth State using MongoDB
const useMongoDBAuthState = async (userId, db) => {
  const authCollection = db.collection("whatsapp_auth");

  const readData = async (key) => {
    const doc = await authCollection.findOne({ userId, key });
    return doc?.value || null;
  };

  const writeData = (data, key) => {
    return authCollection.replaceOne({ userId, key }, { userId, key, value: data }, { upsert: true });
  };

  const removeData = async (key) => {
    try {
      await authCollection.deleteOne({ userId, key });
    } catch (error) {
      // Ignore
    }
  };

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
          for (const key in data) {
            for (const id in data[key]) {
              const value = data[key][id];
              const fullKey = `${key}-${id}`;
              tasks.push(value ? writeData(value, fullKey) : removeData(fullKey));
            }
          }
          await Promise.all(tasks);
        },
      },
    },
    saveCreds: () => {
      return writeData(creds, "creds");
    },
  };
};

class WhatsAppBotManager {
  constructor(
    mongoUri = "mongodb+srv://luciferDBUser:creole123@serverlessinstance0.vnqkynp.mongodb.net/luciferai-test?retryWrites=true&w=majority",
    dbName = "whatsapp_bot"
  ) {
    this.mongoUri = mongoUri;
    this.dbName = dbName;
    this.client = null;
    this.db = null;
    this.activeBots = new Map(); // userId -> bot instance
  }

  async connect() {
    try {
      this.client = new MongoClient(this.mongoUri);
      await this.client.connect();
      this.db = this.client.db(this.dbName);
      console.log("✅ Connected to MongoDB");

      // Create indexes for better performance
      await this.db.collection("whatsapp_auth").createIndex({ userId: 1, key: 1 }, { unique: true });
      await this.db.collection("whatsapp_sessions").createIndex({ userId: 1 });
      await this.db
        .collection("messages")
        .createIndex({ userId: 1, timestamp: -1 });
    } catch (error) {
      console.error("❌ MongoDB connection error:", error);
      throw error;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.close();
      console.log("🔌 Disconnected from MongoDB");
    }
  }

  async createBot(userId) {
    if (this.activeBots.has(userId)) {
      console.log(`⚠️ Bot for user ${userId} already exists`);
      return this.activeBots.get(userId);
    }

    try {
      const bot = new WhatsAppBot(userId, this.db);
      this.activeBots.set(userId, bot);
      await bot.start();

      // Store session info
      await this.db.collection("whatsapp_sessions").updateOne(
        { userId },
        {
          $set: {
            userId,
            status: "initializing",
            createdAt: new Date(),
            lastActivity: new Date(),
          },
        },
        { upsert: true }
      );

      console.log(`🤖 Created bot for user: ${userId}`);
      return bot;
    } catch (error) {
      console.error(`❌ Error creating bot for user ${userId}:`, error);
      this.activeBots.delete(userId);
      throw error;
    }
  }

  async removeBot(userId) {
    const bot = this.activeBots.get(userId);
    if (bot) {
      await bot.stop();
      this.activeBots.delete(userId);

      // Update session status
      await this.db.collection("whatsapp_sessions").updateOne(
        { userId },
        {
          $set: {
            status: "disconnected",
            disconnectedAt: new Date(),
          },
        }
      );

      console.log(`🗑️ Removed bot for user: ${userId}`);
    }
  }

  getBot(userId) {
    return this.activeBots.get(userId);
  }

  getAllActiveBots() {
    return Array.from(this.activeBots.keys());
  }

  async getActiveUsers() {
    return await this.db
      .collection("whatsapp_sessions")
      .find({ status: { $in: ["connected", "initializing"] } })
      .toArray();
  }
}

class WhatsAppBot {
  constructor(userId, db) {
    this.userId = userId;
    this.db = db;
    this.sock = null;
    this.qrGenerated = false;
  }

  async start() {
    try {
      // Get auth state from MongoDB
      const { state, saveCreds } = await useMongoDBAuthState(this.userId, this.db);

      // Create WhatsApp socket connection
      this.sock = makeWASocket({
        logger,
        auth: state,
        defaultQueryTimeoutMs: 60000,
        browser: [`Bot-${this.userId}`, "Chrome", "1.0.0"],
        msgRetryCounterMap: {},
        shouldIgnoreJid: (jid) => isJidBroadcast(jid),
      });

      // Event listeners
      this.setupEventListeners(saveCreds);

      return this.sock;
    } catch (error) {
      console.error(
        `❌ Error starting WhatsApp bot for user ${this.userId}:`,
        error
      );
      throw error;
    }
  }

  setupEventListeners(saveCreds) {
    // Connection state updates
    this.sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr && !this.qrGenerated) {
        console.log(
          `\n📱 QR Code generated for user ${this.userId}! Scan with WhatsApp to connect.\n`
        );

        // Display QR code in terminal
        qrcode.generate(qr, { small: true });

        // Store QR code in database for web interface access
        await this.db.collection("whatsapp_sessions").updateOne(
          { userId: this.userId },
          {
            $set: {
              qrCode: qr,
              status: "qr_generated",
              qrGeneratedAt: new Date(),
            },
          }
        );

        console.log(
          `\n🔗 QR Code stored in database for user: ${this.userId}\n`
        );
        this.qrGenerated = true;
      }

      if (connection === "close") {
        const shouldReconnect =
          lastDisconnect?.error?.output?.statusCode !==
          DisconnectReason.loggedOut;

        console.log(
          `❌ Connection closed for user ${this.userId}. Reason:`, lastDisconnect,
          lastDisconnect?.error?.data?.attrs ? ` (Attrs: ${JSON.stringify(lastDisconnect.error.data.attrs)})` : ''
        );

        // Update session status
        await this.db.collection("whatsapp_sessions").updateOne(
          { userId: this.userId },
          {
            $set: {
              status: "disconnected",
              lastDisconnect: lastDisconnect?.error?.message,
              disconnectedAt: new Date(),
            },
          }
        );

        if (shouldReconnect) {
          console.log(`🔄 Reconnecting user ${this.userId}...`);
          setTimeout(() => this.start(), 5000); // Wait 5 seconds before reconnecting
        }
      } else if (connection === "open") {
        console.log(
          `✅ WhatsApp connection established for user: ${this.userId}`
        );
        this.qrGenerated = false;

        // Update session status
        await this.db.collection("whatsapp_sessions").updateOne(
          { userId: this.userId },
          {
            $set: {
              status: "connected",
              connectedAt: new Date(),
              phoneNumber: this.sock.user?.id?.split(":")[0],
              $unset: { qrCode: 1 },
            },
          }
        );
      }
    });

    // Save credentials when updated
    this.sock.ev.on("creds.update", saveCreds);

    // Handle key updates
    this.sock.ev.on(
      "messaging-history.set",
      async ({ chats, contacts, messages, isLatest }) => {
        console.log(
          `📚 [User: ${this.userId}] Received messaging history. Chats: ${chats.length}, Contacts: ${contacts.length}, Messages: ${messages.length}`
        );
      }
    );

    // Handle incoming messages
    this.sock.ev.on("messages.upsert", async (m) => {
      const message = m.messages[0];

      if (!message.key.fromMe && m.type === "notify") {
        await this.handleIncomingMessage(message);

        // Update last activity
        await this.db
          .collection("whatsapp_sessions")
          .updateOne(
            { userId: this.userId },
            { $set: { lastActivity: new Date() } }
          );
      }
    });

    // Handle group updates
    this.sock.ev.on("groups.update", (updates) => {
      console.log(`📢 Group updates for user ${this.userId}:`, updates);
    });

    // Handle presence updates
    this.sock.ev.on("presence.update", ({ id, presences }) => {
      console.log(
        `👤 Presence update for user ${this.userId} - ${id}:`,
        presences
      );
    });
  }

  async handleIncomingMessage(message) {
    try {
      const remoteJid = message.key.remoteJid;
      const messageText =
        message.message?.conversation ||
        message.message?.extendedTextMessage?.text ||
        "";

      const senderName = message.pushName || "Unknown";
      const isGroup = remoteJid?.endsWith("@g.us");

      console.log(
        `\n💬 [User: ${this.userId}] ${
          isGroup ? "Group" : "Direct"
        } message from ${senderName}:`
      );
      console.log(`📝 Content: ${messageText}`);
      console.log(`📍 Chat ID: ${remoteJid}`);

      // Store message in database
      await this.db.collection("messages").insertOne({
        userId: this.userId,
        messageId: message.key.id,
        remoteJid,
        senderName,
        messageText,
        isGroup,
        timestamp: new Date(message.messageTimestamp * 1000),
        receivedAt: new Date(),
      });

      // Bot commands
      await this.processCommands(remoteJid, messageText, message);
    } catch (error) {
      console.error(
        `❌ Error handling message for user ${this.userId}:`,
        error
      );
    }
  }

  async processCommands(chatId, text, originalMessage) {
    const command = text.toLowerCase().trim();

    switch (command) {
      case "/start":
      case "/help":
        await this.sendMessage(
          chatId,
          `🤖 *WhatsApp Bot Commands (User: ${this.userId}):*\n\n` +
            `• /help - Show this help menu\n` +
            `• /ping - Test bot response\n` +
            `• /time - Get current time\n` +
            `• /joke - Random joke\n` +
            `• /status - Bot status\n` +
            `• /info - Chat information\n` +
            `• /userid - Show your user ID`
        );
        break;

      case "/ping":
        await this.sendMessage(
          chatId,
          `🏓 Pong! Bot is active for user: ${this.userId}`
        );
        break;

      case "/userid":
        await this.sendMessage(chatId, `🆔 Your User ID: ${this.userId}`);
        break;

      case "/time":
        const now = new Date();
        await this.sendMessage(
          chatId,
          `⏰ Current time: ${now.toLocaleString()}`
        );
        break;

      case "/joke":
        const jokes = [
          "Why don't scientists trust atoms? Because they make up everything! 😄",
          "Why did the WhatsApp bot go to therapy? It had too many connection issues! 🤖",
          "What do you call a bot that works weekends? Dedicated! 💪",
          `Why did user ${this.userId} choose this bot? Because it's multi-talented! 🎭`,
        ];
        const randomJoke = jokes[Math.floor(Math.random() * jokes.length)];
        await this.sendMessage(chatId, randomJoke);
        break;

      case "/status":
        const sessions = await this.db
          .collection("whatsapp_sessions")
          .countDocuments({ status: "connected" });

        await this.sendMessage(
          chatId,
          `✅ *Bot Status: Online*\n` +
            `👤 User ID: ${this.userId}\n` +
            `🕐 Uptime: ${process.uptime().toFixed(0)} seconds\n` +
            `📱 Connected to WhatsApp Web\n` +
            `👥 Total active sessions: ${sessions}`
        );
        break;

      case "/info":
        const isGroup = chatId?.endsWith("@g.us");
        let info = `📋 *Chat Information (User: ${this.userId}):*\n\n`;
        info += `• Type: ${isGroup ? "Group" : "Private"}\n`;
        info += `• Chat ID: ${chatId}\n`;

        if (isGroup) {
          try {
            const groupMetadata = await this.sock.groupMetadata(chatId);
            info += `• Group Name: ${groupMetadata.subject}\n`;
            info += `• Members: ${groupMetadata.participants.length}\n`;
          } catch (error) {
            info += `• Group info: Unable to fetch\n`;
          }
        }

        await this.sendMessage(chatId, info);
        break;

      default:
        // Echo non-command messages with a friendly response
        if (text && !text.startsWith("/")) {
          await this.sendMessage(
            chatId,
            `Thanks for your message! 😊\n` +
              `You said: "${text}"\n` +
              `Bot User: ${this.userId}\n\n` +
              `Type /help for available commands.`
          );
        }
    }
  }

  async sendMessage(jid, text) {
    try {
      await this.sock.sendMessage(jid, { text });
      console.log(
        `✉️ [User: ${this.userId}] Message sent to ${jid}: ${text.substring(
          0,
          50
        )}...`
      );

      // Store sent message in database
      await this.db.collection("messages").insertOne({
        userId: this.userId,
        remoteJid: jid,
        messageText: text,
        isOutgoing: true,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error(`❌ Error sending message for user ${this.userId}:`, error);
    }
  }

  async sendImage(jid, imagePath, caption = "") {
    try {
      await this.sock.sendMessage(jid, {
        image: { url: imagePath },
        caption: caption,
      });
      console.log(`🖼️ [User: ${this.userId}] Image sent to ${jid}`);
    } catch (error) {
      console.error(`❌ Error sending image for user ${this.userId}:`, error);
    }
  }

  async sendDocument(jid, documentPath, fileName) {
    try {
      await this.sock.sendMessage(jid, {
        document: { url: documentPath },
        fileName: fileName,
        mimetype: "application/pdf",
      });
      console.log(`📄 [User: ${this.userId}] Document sent to ${jid}`);
    } catch (error) {
      console.error(
        `❌ Error sending document for user ${this.userId}:`,
        error
      );
    }
  }

  async downloadMedia(message) {
    try {
      const buffer = await downloadMediaMessage(
        message,
        "buffer",
        {},
        {
          logger,
          reuploadRequest: this.sock.updateMediaMessage,
        }
      );
      return buffer;
    } catch (error) {
      console.error(
        `❌ Error downloading media for user ${this.userId}:`,
        error
      );
      return null;
    }
  }

  async getGroups() {
    try {
      const groups = await this.sock.groupFetchAllParticipating();
      console.log(
        `👥 [User: ${this.userId}] Available groups:`,
        Object.keys(groups).length
      );
      return groups;
    } catch (error) {
      console.error(`❌ Error fetching groups for user ${this.userId}:`, error);
      return {};
    }
  }

  async setPresence(jid, presence = "available") {
    try {
      await this.sock.sendPresenceUpdate(presence, jid);
      console.log(
        `👻 [User: ${this.userId}] Presence set to ${presence} for ${jid}`
      );
    } catch (error) {
      console.error(
        `❌ Error setting presence for user ${this.userId}:`,
        error
      );
    }
  }

  async stop() {
    if (this.sock) {
      await this.sock.logout();

      // Update session status
      await this.db.collection("whatsapp_sessions").updateOne(
        { userId: this.userId },
        {
          $set: {
            status: "disconnected",
            disconnectedAt: new Date(),
          },
        }
      );

      console.log(`🔌 [User: ${this.userId}] WhatsApp bot disconnected`);
    }
  }
}

// Usage example and API
async function main() {
  console.log("🚀 Starting Multi-User WhatsApp Bot Manager...\n");

  const botManager = new WhatsAppBotManager();
  await botManager.connect();

  // Example: Create bots for multiple users
  const users = ["user1", "user2", "user3"]; // These could come from your user management system

  for (const userId of users) {
    try {
      await botManager.createBot(userId);
      console.log(`✅ Bot created for user: ${userId}`);
    } catch (error) {
      console.error(`❌ Failed to create bot for user ${userId}:`, error);
    }
  }

  // API endpoints (if using Express.js)
  const setupAPI = (app) => {
    // Create bot for new user
    app.post("/api/bot/create/:userId", async (req, res) => {
      try {
        const { userId } = req.params;
        const bot = await botManager.createBot(userId);
        res.json({ success: true, message: `Bot created for user ${userId}` });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Get QR code for user
    app.get("/api/bot/qr/:userId", async (req, res) => {
      try {
        const { userId } = req.params;
        const session = await botManager.db
          .collection("whatsapp_sessions")
          .findOne({ userId, qrCode: { $exists: true } });

        if (session?.qrCode) {
          res.json({ success: true, qrCode: session.qrCode });
        } else {
          res.json({ success: false, message: "QR code not available" });
        }
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Send message via API
    app.post("/api/bot/send/:userId", async (req, res) => {
      try {
        const { userId } = req.params;
        const { chatId, message } = req.body;

        const bot = botManager.getBot(userId);
        if (!bot) {
          return res
            .status(404)
            .json({ success: false, message: "Bot not found" });
        }

        await bot.sendMessage(chatId, message);
        res.json({ success: true, message: "Message sent successfully" });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Get active users
    app.get("/api/bot/users", async (req, res) => {
      try {
        const activeUsers = await botManager.getActiveUsers();
        res.json({ success: true, users: activeUsers });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Remove bot
    app.delete("/api/bot/:userId", async (req, res) => {
      try {
        const { userId } = req.params;
        await botManager.removeBot(userId);
        res.json({ success: true, message: `Bot removed for user ${userId}` });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });
  };

  // Handle graceful shutdown
  process.on("SIGINT", async () => {
    console.log("\n⏹️ Shutting down bot manager...");

    // Stop all active bots
    const activeUsers = botManager.getAllActiveBots();
    for (const userId of activeUsers) {
      await botManager.removeBot(userId);
    }

    await botManager.disconnect();
    process.exit(0);
  });

  // Keep the process running
  process.stdin.resume();

  return { botManager, setupAPI };
}

// Start the application
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { WhatsAppBotManager, WhatsAppBot, useMongoDBAuthState };