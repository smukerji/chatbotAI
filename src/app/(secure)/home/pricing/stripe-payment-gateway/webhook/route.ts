import { NextResponse } from "next/server";
import clientPromise from "@/db";
import Stripe from "stripe";
import { ObjectId } from "mongodb";
const stripe = new Stripe(String(process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY));
import express from "express";
const app = express();

export async function POST(req: any, res: any) {
  if (req.method === "POST") {
    // const db = (await clientPromise!).db();
    // const collection = db.collection("users");
    // const collectionDetails = db.collection("user-details");
    // const collectionPlan = db.collection("plans");
    // const collectionPayment = db.collection("payment-history");

    const sig = req.headers.get("stripe-signature");
    const endpointSecret: any = process.env.NEXT_PUBLIC_STRIPE_WEBHOOK_PUBLIC;

    let event: any;
    const body = await req.text();

    // console.log("bodyyyyy", endpointSecret);

    try {
      event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    } catch (err) {
      console.error("Webhook signature verification failed.", err);
      return res.status(400).end();
    }

    console.log("eventttttttttttt", event.data, event.type);

    // Handle the event
    let plan;
    let planData;
    let date;
    let addOns;
    let userData;
    let Details;
    let status;
    switch (event.type) {
      case "customer.subscription.created":
        console.log("coming inside customer subscription created");

        break;
      case "customer.subscription.updated":
        console.log("Checkout session completed:", event.data.object);

        break;
      case "invoice.paid":
        console.log("invoice paid webhook");

        break;

      case "customer.subscription.deleted":
        console.log("subscription_schedule.canceled", event.data.object);
        break;

      default:
        console.warn("Unhandled event type:", event.type);
    }

    // Return a response to acknowledge receipt of the event
    return NextResponse.json({ received: true });
  }

  // Respond to other HTTP methods
  res.setHeader("Allow", ["POST"]);
  return `Method ${req.method} Not Allowed`;
}
