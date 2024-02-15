// const { connectDatabase } = require("./src/db.js");
const { MongoClient } = require("mongodb");
require("dotenv").config({path:'.env.local'});


const uri = process.env.NEXT_PUBLIC_MONGO_URI;

async function initializeDb() {
  let client = new MongoClient(uri);
  let db = (await client.connect()).db();

  const planCollection = db.collection("plans");
  const accountsColection = db.collection("accounts");
  const userColection = db.collection("users");

  /// update/insert starter plan
  await planCollection.updateOne(
    { name: "starter" },
    {
      $set: {
        name: "starter",
        numberOfChatbot: 5,
        messageLimit: 10000,
        trainingDataLimit: 1000000,
        websiteCrawlingLimit: 50,
      },
    },
    { upsert: true }
  );

  /// get the starter plan ID
  const starterPlan = await db.collection("plans").findOne({ name: "starter" });
  /// set the default plan Id for each user
  await userColection.updateMany(
    {},
    {
      $set: {
        planId: starterPlan?._id,
      },
    },
    { upsert: true }
  );

  console.log("Database initialized successfully");
  process.exit();
}

initializeDb().catch((error) => {
  console.error("Error initializing database:", error);
  process.exit(1);
});
