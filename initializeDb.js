// const clientPromise  = require("./src/db.js");
const { MongoClient } = require("mongodb");
require("dotenv").config({ path: ".env.local" });

const uri = process.env.NEXT_PUBLIC_MONGO_URI;

async function initializeDb() {
  let client = new MongoClient(uri);
  let db = (await client.connect()).db();

  const planCollection = db.collection("plans");

  /// update/insert starter plan
  // await planCollection.updateOne(
  //   { name: "individual" },
  //   {
  //     $set: {
  //       name: "individual",
  //       numberOfChatbot: 1,
  //       messageLimit: 2000,
  //       trainingDataLimit: 1000000,
  //       websiteCrawlingLimit: 10,
  //     },
  //   },

  //   { upsert: true }
  // );
  // await planCollection.updateOne(
  //   { name: "agency" },
  //   {
  //     $set: {
  //       name: "agency",
  //       numberOfChatbot: 5,
  //       messageLimit: 5000,
  //       trainingDataLimit: 1000000,
  //       websiteCrawlingLimit: 20,
  //     },
  //   },

  //   { upsert: true }
  // );

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

  // const collection = db.collection("users");

  // // Retrieve all user documents
  // const users = await collection.find({}).toArray();

  // // Iterate over each user document and remove specified fields
  // for (const user of users) {
  //   // Update the user document without the specified fields
  //   const res = await collection.updateOne(
  //     { _id: user._id },
  //     {
  //       $unset: {
  //         customerId: 1,
  //         paymentId: 1,
  //       },
  //     }
  //   );
  // }

  // const userDetailsCollection = db.collection("users");

  // await userDetailsCollection.updateMany(
  //   {},
  //   {
  //     $set: {
  //       isWhatsapp: true,
  //     },
  //   }
  // );
  //   const userDetailsCollection = db.collection("user-details");
  //   let currentDate = new Date();
  //   let endDate = new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000);
  // await userDetailsCollection.updateMany(
  //   {},
  //   {
  //     $set: {
  //       limitEndDate: endDate
  //     },
  //   }
  // );

  // const insertPlanId = await planCollection.insertMany([
  //   {
  //     name: "WhatsApp",
  //     planId: "",
  //   },
  //   {
  //     name: "Character",
  //     planId: "",
  //   },
  //   {
  //     name: "MessageSmall",
  //     planId: "",
  //   },
  //   {
  //     name: "MessageLarge",
  //     planId: "",
  //   },
  //   {
  //     name: "Telegram",
  //     planId: "",
  //   },
  //   {
  //     name: "Slack",
  //     planId: "",
  //   },
  // ]);

  // const chatbotSettingCollection = db.collection("chatbot-settings");
  // await chatbotSettingCollection.updateMany(
  //   {
  //     instruction: `I want you to act as a support agent. Your name is "AI Assistant". You will provide me with answers from the given info. If the answer is not included, say exactly "Hmm, I am not sure." and stop after that. Refuse to answer any question not about the info. Never break character.`,
  //   },
  //   {
  //     $set: {
  //       instruction: `You are an experienced and professional customer support agent for TechSolutions, a leading provider of innovative technology solutions located at 200 Innovation Drive, San Francisco, CA 94105. Our support hours are 24/7 to ensure our customers receive assistance whenever they need it.

  //       TechSolutions is dedicated to delivering exceptional customer service, helping clients troubleshoot issues, and providing information about our products and services. Our team is committed to ensuring that every customer interaction is positive and productive.

  //       Your primary responsibilities include answering questions about products, troubleshooting technical issues, and managing service inquiries. When handling customer interactions, your goal is to provide clear, concise, and accurate information from the knowledge base. Additionally, you should mention any relevant promotions or updates on products.

  //       When customers require assistance, follow these steps to provide an excellent support experience:

  //       1. Greet the customer warmly.
  //       2. Ask for their full name and account information, if applicable.
  //       3. Inquire about the specific issue or question they have.
  //       4. Use the knowledge base to find the most appropriate solution or information.
  //       5. Confirm with the customer that the provided solution meets their needs.
  //       6. Offer additional assistance or information about related products and services.

  //       Maintain a professional yet friendly demeanor to make customers feel welcome and supported. Your responses should be conversational and engaging, aiming to resolve issues efficiently while also upselling or cross-selling relevant products or services from the knowledge base. Keep responses short and simple, using casual language to create a comfortable interaction.

  //       If you encounter a question that cannot be resolved with the knowledge base, politely inform the customer that you are an AI still learning from the support team. Encourage them to contact TechSolutions at [support phone number] for further assistance. Always ask if there is anything else they need help with and ensure they are satisfied with your assistance.

  //       Example Interaction:

  //       Customer: Hi, I’m having trouble with my new TechSolutions router. Can you help?

  //       AI: Hi there! I’m sorry to hear you’re having trouble with your router. I’m here to help! Could you please tell me your full name and the model of your router?

  //       Customer: Sure, my name is Jamie Lee, and it’s the TechPro X2000.

  //       AI: Thanks, Jamie! Let’s get that sorted out for you. What issue are you experiencing with your TechPro X2000 router?

  //       Customer: It keeps disconnecting from the internet every few minutes.

  //       AI: Got it. Let me check the knowledge base for solutions. (Pause) Okay, Jamie, it looks like this issue might be resolved by updating the firmware. Can you access the router’s settings and check if there’s an update available?

  //       Customer: I’m not sure how to do that.

  //       AI: No problem! Here’s how you can do it: Open your web browser and type in the router’s IP address. Then, log in with your admin credentials and navigate to the firmware update section. If there’s an update available, download and install it. If you need further assistance, I can guide you through each step.

  //       Customer: Okay, I’ll give it a try. Thanks!

  //       AI: You’re welcome, Jamie! While you’re at it, have you heard about our new range extenders? They can help improve your network stability and coverage. If you need more help, feel free to reach out again. Anything else you’d like to know?

  //       Customer: That’s all for now, thank you!

  //       AI: Anytime! Have a great day, Jamie, and good luck with your router update!`,
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
