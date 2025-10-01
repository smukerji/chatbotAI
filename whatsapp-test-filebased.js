const {
  default: makeWASocket,
  AuthenticationState,
  DisconnectReason,
  useMultiFileAuthState,
  downloadMediaMessage,
} = require("@whiskeysockets/baileys");
const { Boom } = require("@hapi/boom");
const pino = require("pino");
const qrcode = require("qrcode-terminal");

// Logger configuration
const logger = pino({ level: "silent" });

class WhatsAppBot {
  constructor() {
    this.sock = null;
    this.qrGenerated = false;
  }

  async start() {
    try {
      // Use multi-file auth state for session management
      const { state, saveCreds } = await useMultiFileAuthState(
        "./auth_info_baileys"
      );

      // Create WhatsApp socket connection
      this.sock = makeWASocket({
        logger,
        auth: state,
        // Default configuration
        defaultQueryTimeoutMs: 60000,
      });

      // Event listeners
      this.setupEventListeners(saveCreds);

      return this.sock;
    } catch (error) {
      console.error("Error starting WhatsApp bot:", error);
    }
  }

  setupEventListeners(saveCreds) {
    // Connection state updates
    this.sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr && !this.qrGenerated) {
        console.log("\n📱 QR Code generated! Scan with WhatsApp to connect.\n");

        // Display QR code in terminal
        qrcode.generate(qr, { small: true });

        console.log(
          "\nAlternatively, you can scan this QR code with your WhatsApp:\n"
        );
        this.qrGenerated = true;
      }

      if (connection === "close") {
        const shouldReconnect =
          lastDisconnect?.error?.output?.statusCode !==
          DisconnectReason.loggedOut;

        console.log("❌ Connection closed. Reason:", lastDisconnect?.error);

        if (shouldReconnect) {
          console.log("🔄 Reconnecting...");
          this.start();
        }
      } else if (connection === "open") {
        console.log("✅ WhatsApp connection established!");
        this.qrGenerated = false;
      }
    });

    // Save credentials when updated
    this.sock.ev.on("creds.update", saveCreds);

    // Handle incoming messages
    this.sock.ev.on("messages.upsert", async (m) => {
      const message = m.messages[0];

      if (!message.key.fromMe && m.type === "notify") {
        await this.handleIncomingMessage(message);
      }
    });

    // Handle group updates
    this.sock.ev.on("groups.update", (updates) => {
      console.log("📢 Group updates:", updates);
    });

    // Handle presence updates
    this.sock.ev.on("presence.update", ({ id, presences }) => {
      console.log(`👤 Presence update for ${id}:`, presences);
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
        `\n💬 ${isGroup ? "Group" : "Direct"} message from ${senderName}:`
      );
      console.log(`📝 Content: ${messageText}`);
      console.log(`📍 Chat ID: ${remoteJid}`);

      // Bot commands
      await this.processCommands(remoteJid, messageText, message);
    } catch (error) {
      console.error("Error handling message:", error);
    }
  }

  async processCommands(chatId, text, originalMessage) {
    const command = text.toLowerCase().trim();

    switch (command) {
      case "/start":
      case "/help":
        await this.sendMessage(
          chatId,
          `🤖 *WhatsApp Bot Commands:*\n\n` +
            `• /help - Show this help menu\n` +
            `• /ping - Test bot response\n` +
            `• /time - Get current time\n` +
            `• /joke - Random joke\n` +
            `• /status - Bot status\n` +
            `• /info - Chat information`
        );
        break;

      case "/ping":
        await this.sendMessage(chatId, "🏓 Pong! Bot is active.");
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
        ];
        const randomJoke = jokes[Math.floor(Math.random() * jokes.length)];
        await this.sendMessage(chatId, randomJoke);
        break;

      case "/status":
        await this.sendMessage(
          chatId,
          `✅ *Bot Status: Online*\n` +
            `🕐 Uptime: ${process.uptime().toFixed(0)} seconds\n` +
            `📱 Connected to WhatsApp Web`
        );
        break;

      case "/info":
        const isGroup = chatId?.endsWith("@g.us");
        let info = `📋 *Chat Information:*\n\n`;
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
              `You said: "${text}"\n\n` +
              `Type /help for available commands.`
          );
        }
    }
  }

  async sendMessage(jid, text) {
    try {
      await this.sock.sendMessage(jid, { text });
      console.log(`✉️ Message sent to ${jid}: ${text.substring(0, 50)}...`);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  }

  async sendImage(jid, imagePath, caption = "") {
    try {
      await this.sock.sendMessage(jid, {
        image: { url: imagePath },
        caption: caption,
      });
      console.log(`🖼️ Image sent to ${jid}`);
    } catch (error) {
      console.error("Error sending image:", error);
    }
  }

  async sendDocument(jid, documentPath, fileName) {
    try {
      await this.sock.sendMessage(jid, {
        document: { url: documentPath },
        fileName: fileName,
        mimetype: "application/pdf",
      });
      console.log(`📄 Document sent to ${jid}`);
    } catch (error) {
      console.error("Error sending document:", error);
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
      console.error("Error downloading media:", error);
      return null;
    }
  }

  async getGroups() {
    try {
      const groups = await this.sock.groupFetchAllParticipating();
      console.log("👥 Available groups:", Object.keys(groups).length);
      return groups;
    } catch (error) {
      console.error("Error fetching groups:", error);
      return {};
    }
  }

  async setPresence(jid, presence = "available") {
    try {
      await this.sock.sendPresenceUpdate(presence, jid);
      console.log(`👻 Presence set to ${presence} for ${jid}`);
    } catch (error) {
      console.error("Error setting presence:", error);
    }
  }

  async stop() {
    if (this.sock) {
      await this.sock.logout();
      console.log("🔌 WhatsApp bot disconnected");
    }
  }
}

// Usage example
async function main() {
  console.log("🚀 Starting WhatsApp Bot...\n");

  const bot = new WhatsAppBot();
  await bot.start();

  // Handle graceful shutdown
  process.on("SIGINT", async () => {
    console.log("\n⏹️ Shutting down bot...");
    await bot.stop();
    process.exit(0);
  });

  // Keep the process running
  process.stdin.resume();
}

// Start the bot
if (require.main === module) {
  main().catch(console.error);
}

module.exports = WhatsAppBot;
