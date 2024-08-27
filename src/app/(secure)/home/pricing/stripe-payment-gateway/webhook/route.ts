import { NextResponse } from "next/server";
import clientPromise from "@/db";
import Stripe from "stripe";
import { ObjectId } from "mongodb";
const stripe = new Stripe(String(process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY));
import express from "express";
const app = express();

export async function POST(req: any, res: any) {
  if (req.method === "POST") {
    const db = (await clientPromise!).db();
    const collection = db.collection("users");
    const collectionDetails = db.collection("user-details");
    const collectionPlan = db.collection("plans");
    const collectionPayment = db.collection("payment-history");

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

    // console.log("eventttttttttttt", event.data.object.items.data, event.type);

    let planIds = event.data.object.items.data.map((data: any) => {
      return data.plan.id;
    });

    // Handle the event
    let planData;
    let date;
    let userData: any;
    let Details;
    let status;
    switch (event.type) {
      case "customer.subscription.created":
        console.log("coming inside customer subscription created");

        date = new Date(event.data.object.current_period_end * 1000);
        userData = await collection.findOne({
          customerId: event.data.object.customer,
        });
        Details = await collectionDetails.findOne({
          userId: String(userData._id),
        });

        for (let planId of planIds) {
          console.log(
            planId === process.env.NEXT_PUBLIC_WHATSAPP_PLAN_ID,
            "lllllllllllllllllllllllllll",
            "going inside "
          );
          if (planId === process.env.NEXT_PUBLIC_WHATSAPP_PLAN_ID) {
            await collection.updateOne(
              { customerId: event.data.object.customer },
              {
                $set: {
                  isWhatsapp: true,
                  subIdWhatsapp: event.data.object.id,
                  nextIsWhatsapp: true,
                },
              }
            );
          } else if (planId === process.env.NEXT_PUBLIC_SLACK_PLAN_ID) {
            await collectionDetails.updateMany(
              { userId: String(userData._id) },
              {
                $set: {
                  isSlack: true,
                  subIdSlack: event.data.object.id,
                },
              }
            );
          } else if (planId === process.env.NEXT_PUBLIC_TELEGRAM_PLAN_ID) {
            await collectionDetails.updateMany(
              { userId: String(userData._id) },
              {
                $set: {
                  isTelegram: true,
                  subIdTelegram: event.data.object.id,
                },
              }
            );
          } else if (planId === process.env.NEXT_PUBLIC_MESSAGESMALL_PLAN_ID) {
            await collectionDetails.updateMany(
              { userId: String(userData._id) },
              {
                $set: {
                  messageLimit: Number(Details?.messageLimit) + 5000,
                },
              }
            );
          } else if (planId === process.env.NEXT_PUBLIC_MESSAGELARGE_PLAN_ID) {
            await collectionDetails.updateMany(
              { userId: String(userData._id) },
              {
                $set: {
                  messageLimit: Number(Details?.messageLimit) + 10000,
                },
              }
            );
          } else if (planId === process.env.NEXT_PUBLIC_CHARACTER_PLAN_ID) {
            await collectionDetails.updateMany(
              { userId: String(userData._id) },
              {
                $set: {
                  trainingDataLimit:
                    Number(Details?.trainingDataLimit) + 1000000,
                },
              }
            );
          } else {
            // Update plan details
            planData = await collectionPlan.findOne({
              priceId: { $in: planIds },
            });
            if (planData) {
              console.log("customer rrrr idddd", event.data.object.customer);

              await collection.updateOne(
                { customerId: event.data.object.customer },
                {
                  $set: {
                    subId: event.data.object.id,
                    stripePlanId: event.data.object.plan.id,
                    endDate: date,
                    plan: planData.name,
                    planId: planData._id,
                    status: "active",
                  },
                }
              );
              await collectionDetails.updateMany(
                { userId: String(userData._id) },
                {
                  $set: {
                    trainingDataLimit: planData.trainingDataLimit,
                    totalMessageCount: 0,
                    messageLimit: planData.messageLimit,
                    chatbotLimit: planData.numberOfChatbot,
                  },
                }
              );
            }
          }
        }

        // console.log(">>>>>>>>>>>>>", event.data.object.plan);

        break;
      case "customer.subscription.updated":
        console.log("Checkout session completed:");

        break;
      case "invoice.paid":
        console.log("invoice paid webhook");

        date = new Date(event.data.object.lines.data[0].period.end * 1000);
        planData = await collection.findOne({
          customerId: event.data.object.customer,
        });

        status = event.data.object.status === "paid" ? "success" : "failed";

        const currentDate = new Date();
        const formattedDate = currentDate.toLocaleString("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
        });

        await collectionPayment.insertOne({
          userId: String(planData._id),
          status,
          date: formattedDate,
          price: "$" + event.data.object.amount_paid / 100,
          paymentId: event.data.object.id,
        });

        // Optionally update subscription end date if it's a renewal
        await collection.updateOne(
          { customerId: event.data.object.customer },
          { $set: { endDate: date } }
        );

        break;

      case "customer.subscription.deleted":
        console.log("subscription_schedule.canceled", event.data.object);

        await collection.updateOne(
          { customerId: event.data.object.customer },
          {
            $set: {
              status: "canceled",
              endDate: new Date(event.data.object.current_period_end * 1000),
            },
          }
        );

        await collectionDetails.updateMany(
          { userId: String(userData?._id) },
          {
            $set: {
              isWhatsapp: false,
              isSlack: false,
              isTelegram: false,
              messageLimit: 0,
              trainingDataLimit: 0,
            },
          }
        );
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
