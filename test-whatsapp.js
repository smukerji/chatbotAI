

const { WhatsAppBotManager } = require('./whatsapp-test.js');

async function test() {
  console.log("🚀 Starting Test for Multi-User WhatsApp Bot Manager...\n");

  const botManager = new WhatsAppBotManager();
  await botManager.connect();

  const users = ["testUser1"];

  for (const userId of users) {
    try {
      await botManager.createBot(userId);
      console.log(`✅ Bot creation process initiated for user: ${userId}`);
    } catch (error) {
      console.error(`❌ Failed to create bot for user ${userId}:`, error);
    }
  }

  // Keep the process running for a bit to see connection logs
  setTimeout(async () => {
    console.log('\nShutting down test...');
    const activeUsers = botManager.getAllActiveBots();
    for (const userId of activeUsers) {
      await botManager.removeBot(userId);
    }
    await botManager.disconnect();
    process.exit(0);
  }, 60000); // run for 60 seconds
}

test().catch(console.error);

