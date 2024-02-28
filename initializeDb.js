// const { connectDatabase } = require("./src/db.js");
const { MongoClient } = require("mongodb");
require("dotenv").config({ path: ".env.local" });

const uri = process.env.NEXT_PUBLIC_MONGO_URI;

async function initializeDb() {
  let client = new MongoClient(uri);
  let db = (await client.connect()).db();

  const planCollection = db.collection("plans");

  /// update/insert starter plan
  await planCollection.updateOne(
    { name: "individual" },
    {
      $set: {
        name: "individual",
        numberOfChatbot: 1,
        messageLimit: 2000,
        trainingDataLimit: 1000000,
        websiteCrawlingLimit: 10,
      },
    },

    { upsert: true }
  );
  await planCollection.updateOne(
    { name: "agency" },
    {
      $set: {
        name: "agency",
        numberOfChatbot: 5,
        messageLimit: 2000,
        trainingDataLimit: 1000000,
        websiteCrawlingLimit: 20,
      },
    },

    { upsert: true }
  );

  // const plan_data = await planCollection.findOne({ name: "individual" });
  // const userCollection = db.collection("users");
  // let currentDate = new Date();
  // let endDate = new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000);

  // await userCollection.updateMany(
  //   {},
  //   {
  //     $set: {
  //       planId: plan_data?._id,
  //       startDate: currentDate,
  //       endDate: endDate,
  //     },
  //   }
  // );

  // const userDetailsCollection = db.collection("user-details");

  // await userDetailsCollection.updateMany(
  //   {},
  //   {
  //     $set: {
  //       messageLimit: plan_data?.messageLimit,
  //       chatbotLimit: plan_data?.numberOfChatbot,
  //       trainingDataLimit: plan_data?.trainingDataLimit,
  //       websiteCrawlingLimit: plan_data?.websiteCrawlingLimit,
  //     },
  //   }
  // );

  console.log("Database initialized successfully");
  process.exit();
}

initializeDb().catch((error) => {
  console.error("Error initializing database:", error);
  process.exit(1);
});
