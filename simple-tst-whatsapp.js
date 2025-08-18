const {
  default: makeWASocket,
  DisconnectReason,
  downloadMediaMessage,
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const qrcode = require("qrcode-terminal");
const { MongoClient } = require("mongodb");

// Logger configuration
const logger = pino({ level: "silent" });

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

  const creds = (await readData("creds")) || require("@whiskeysockets/baileys").initAuthCreds();

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
                value = require("@whiskeysockets/baileys").proto.Message.AppStateSyncKeyData.fromObject(value);
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

async function testSingleUser() {
  console.log("🧪 Testing single user WhatsApp connection...\n");

  // Connect to MongoDB
  const client = new MongoClient("mongodb://localhost:27017");
  await client.connect();
  const db = client.db("whatsapp_test");
  console.log("✅ Connected to MongoDB");

  const userId = "test_user_1";

  try {
    // Create auth state
    const { state: authState, saveCreds } = await useMongoDBAuthState(userId, db);

    console.log("📊 Auth state created:", {
      hasCreds: !!authState.state.creds,
      keyCount: Object.keys(authState.state.keys).length,
    });

    // Create socket
    const sock = makeWASocket({
      logger,
      auth: authState,
      defaultQueryTimeoutMs: 60000,
      browser: ["Test Bot", "Chrome", "1.0.0"],
    });

    // Handle connection updates
    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        console.log(`\n📱 QR Code for user ${userId}:\n`);
        qrcode.generate(qr, { small: true });
        console.log("\nScan this QR code with WhatsApp to connect.\n");
      }

      if (connection === "close") {
        const shouldReconnect =
          lastDisconnect?.error?.output?.statusCode !==
          DisconnectReason.loggedOut;

        console.log("❌ Connection closed:", lastDisconnect, lastDisconnect?.error?.data?.attrs ? ` (Attrs: ${JSON.stringify(lastDisconnect.error.data.attrs)})` : '');

        if (shouldReconnect) {
          console.log("🔄 Attempting to reconnect...");
          setTimeout(() => testSingleUser(), 5000);
        }
      } else if (connection === "open") {
        console.log(`✅ WhatsApp connected for user ${userId}!`);
        console.log(`📱 Phone: ${sock.user.id}`);

        
      }
    });

    // Handle credential updates
    sock.ev.on("creds.update", async (creds) => {
      console.log(`🔑 Credentials updated for user ${userId}`);
      await db.collection("whatsapp_auth").updateOne(
        { userId },
        {
          $set: {
            creds: creds,
            lastUpdated: new Date(),
          },
        }
      );
    });

    // Handle incoming messages
    sock.ev.on("messages.upsert", async (m) => {
      const message = m.messages[0];
      if (!message.key.fromMe && m.type === "notify") {
        const text =
          message.message?.conversation ||
          message.message?.extendedTextMessage?.text ||
          "";
        const from = message.key.remoteJid;

        console.log(`💬 Message from ${from}: ${text}`);

        // Simple echo response
        if (text === "/test") {
          await sock.sendMessage(from, {
            text: `✅ Test successful! User ID: ${userId}\nBot is working correctly.`,
          });
        }
      }
    });
  } catch (error) {
    console.error("❌ Error:", error);
    console.error("Stack:", error.stack);
  }

  // Graceful shutdown
  process.on("SIGINT", async () => {
    console.log("\n⏹️ Shutting down...");
    await client.close();
    process.exit(0);
  });
}

// Run the test
testSingleUser().catch(console.error);
