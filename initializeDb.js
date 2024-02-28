// const { connectDatabase } = require("./src/db.js");
const { MongoClient } = require("mongodb");
require("dotenv").config({ path: ".env.local" });

const uri = process.env.NEXT_PUBLIC_MONGO_URI;

async function initializeDb() {
  let client = new MongoClient(uri);
  let db = (await client.connect()).db();

  const planCollection = db.collection("plans");
  // const accountsCollection = db.collection("accounts");
  // const userCollection = db.collection("users");
  // const paymentHistoryCollection = db.collection('payment-history');

  /// update/insert starter plan
  await planCollection.updateOne(
    { name: "Individual Plan" },
    {
      $set: {
        name: "Individual Plan",
        numberOfChatbot: 1,
        messageLimit: 2000,
        trainingDataLimit: 1000000,
        websiteCrawlingLimit: 10,
      },
    },

    { upsert: true }
  );
  await planCollection.updateOne(
    { name: "Agency Plan" },
    {
      $set: {
        name: "Agency Plan",
        numberOfChatbot: 5,
        messageLimit: 2000,
        trainingDataLimit: 1000000,
        websiteCrawlingLimit: 20,
      },
    },

    { upsert: true }
  );

  console.log('Database initialized successfully');
  process.exit();
}

initializeDb().catch((error) => {
  console.error('Error initializing database:', error);
  process.exit(1);
});
