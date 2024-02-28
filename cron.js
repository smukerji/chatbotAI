const cron = require("node-cron");
const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config({ path: ".env.local" });
// import { Stripe } from "stripe";
const Stripe = require("stripe");

const uri = process.env.NEXT_PUBLIC_MONGO_URI;
const stripe = new Stripe(String(process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY));

// Define your cron job
cron.schedule("*/10 * * * * *", () => {
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
    let price = 0;
    for (let i = 0; i < dataa.length; i++) {
      const data = dataa[i];
      if (data.nextPlan != "") {
        const h = data.paymentId;
        if (data.nextPlan == "Agency Plan") {
          if (data.nextPlanDuration == "month") {
            price = 15;
          } else {
            price = 144;
          }
        } else {
          if (data.nextPlanDuration == "month") {
            price = 89;
          } else {
            price = 854;
          }
        }
        if (h) {
          amount = price * 100;
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

          const currentDate = new Date();
          if (data.nextPlanDuration == "month") {
            const endDate = new Date(
              currentDate.getTime() + 30 * 24 * 60 * 60 * 1000
            );
            const updateData = await collection.updateMany(
              { _id: data._id },
              {
                $set: {
                  plan: data.nextPlan,
                  startDate: currentDate,
                  endDate: endDate,
                  duration: data.nextPlanDuration,
                  planId: data.nextPlanId,
                  nextPlan: data.nextPlan,
                  nextPlanId: data.nextPlanId,
                  nextPlanDuration: data.nextPlanDuration,
                },
              }
            );
            console.log(paymentIntent);
          } else {
            const endDate = new Date(
              currentDate.getTime() + 365 * 24 * 60 * 60 * 1000
            );
            console.log(data._id);
            const updateData = await collection.updateMany(
              { _id: new ObjectId(data._id) },
              {
                $set: {
                  plan: data.nextPlan,
                  startDate: currentDate,
                  endDate: endDate,
                  duration: data.nextPlanDuration,
                  planId: data.nextPlanId,
                  nextPlan: data.nextPlan,
                  nextPlanId: data.nextPlanId,
                  nextPlanDuration: data.nextPlanDuration,
                },
              }
            );
            console.log(paymentIntent);
          }
        } else {
        }
      }
    }
  } catch (error) {
    console.error(error);
  }
}
