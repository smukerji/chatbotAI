const cron = require("node-cron");
const { MongoClient } = require("mongodb");
require("dotenv").config({ path: ".env.local" });
// import { Stripe } from "stripe";
const Stripe = require("stripe");

const uri = process.env.NEXT_PUBLIC_MONGO_URI;
const stripe = new Stripe(String(process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY));

// Define your cron job
cron.schedule("* * * * *", () => {
  console.log("Cron job is running...");
  CronFunction();
});

async function CronFunction() {
  try {
    let client = new MongoClient(uri);
    let db = (await client.connect()).db();
    const collection = db.collection("users");
    const currentDate = new Date();
    const dataa = await collection
      .find({
        endDate: { $lt: currentDate },
      })
      .toArray();

    for (let i = 0; i < dataa.length; i++) {
      const data = dataa[i];
      const h = data.paymentId;
      if (h) {
        let amount = 777 * 100;
        //ANCHOR - stripe payment intent creation
        const paymentIntent = await stripe.paymentIntents.create({
          amount: amount,
          currency: "inr",
          automatic_payment_methods: {
            enabled: true,
          },
          confirm: true,
          customer: data.customerId,
          payment_method: data.paymentId,
          receipt_email: data.email,
          off_session: true,
        });

        console.log(paymentIntent);
      } else {
        //   return NextResponse.json({ status: 500 });
      }
    }
  } catch (error) {
    console.error(error);
  }
}
