import { apiHandler } from "@/app/_helpers/server/api/api-handler";
import clientPromise from "@/db";
import { duration } from "moment";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import Stripe from "stripe";

module.exports = apiHandler({
  // POST: createPaymentIntent,
  PUT: checkCurrentPlan,
});

async function checkCurrentPlan(req: any, res: NextResponse) {
  let { u_id } = await req.json();
  const db = (await clientPromise!).db();
  const collection = db.collection("users");
  const collectionUserDetails = db.collection("user-details");
  const details = await collectionUserDetails.findOne({ userId: u_id });
  const data = await collection.findOne({ _id: new ObjectId(u_id) });
  let currentDate = new Date();
  const date2: any = new Date(data.endDate);
  const date1: any = new Date();
  const stripeKey: any = process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY;
  const stripe = new Stripe(stripeKey);

  const priceId = data.stripePlanId;

  if (!priceId) {
    return {
      status: 400,
      message: "No plan found",
    };
  }

  const price = await stripe.prices.retrieve(priceId);

  const differenceMs = date2 - date1;
  const differenceDays = Math.round(differenceMs / (1000 * 60 * 60 * 24));

  //ANCHOR - check current plan of the user
  if (data.endDate > currentDate) {
    return {
      price: price,
      duration: data?.duration ?? null,
      whatsAppIntegration: data.isWhatsapp,
      slackIntegration: details.isSlack,
      telegramIntegration: details.isTelegram,
      hubspotIntegration: true,
    };
  } else {
    return {
      msg: 0,
      text: "Get started",
      whatsAppIntegration: data.isWhatsapp,
    };
  }
}
