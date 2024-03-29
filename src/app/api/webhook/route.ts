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
    try {
      event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    } catch (err) {
      console.error("Webhook signature verification failed.", err);
      return res.status(400).end();
    }
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
        date = new Date(event.data.object.current_period_end * 1000);
        userData = await collection.findOne({
          customerId: event.data.object.customer,
        });
        Details = await collectionDetails.findOne({
          userId: String(userData._id),
        });
        if (event.data.object.plan.interval == "month") {
          planData = await collectionPlan.findOne({
            planIdMonth: event.data.object.plan.id,
          });
          if (planData == null) {
            addOns = await collectionPlan.findOne({
              planId: event.data.object.plan.id,
            });
            if (addOns.name == "WhatsApp") {
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
            } else if (addOns.name == "MessageSmall") {
              const data = await collectionDetails.updateMany(
                { userId: String(userData._id) },
                {
                  $set: {
                    messageLimit: Number(Details?.messageLimit) + 5000,
                  },
                }
              );
            } else if (addOns.name == "MessageLarge") {
              const data = await collectionDetails.updateMany(
                { userId: String(userData._id) },
                {
                  $set: {
                    messageLimit: Number(Details?.messageLimit) + 10000,
                  },
                }
              );
            } else if (addOns.name == "Character") {
              const data = await collectionDetails.updateMany(
                { userId: String(userData._id) },
                {
                  $set: {
                    trainingDataLimit:
                      Number(Details?.trainingDataLimit) + 1000000,
                  },
                }
              );
            }
          }
        } else {
          planData = await collectionPlan.findOne({
            planIdYear: event.data.object.plan.id,
          });
        }
        if (planData == null) {
        } else {
          plan = planData.name;
          await collection.updateOne(
            { customerId: event.data.object.customer },
            {
              $set: {
                subId: event.data.object.id,
                stripePlanId: event.data.object.plan.id,
                duration: event.data.object.plan.interval,
                endDate: date,
                plan,
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
        break;
      // case 'customer.subscription.updated':
      //   console.log('Checkout session completed:', event.data.object);
      //   planData;
      //   date = new Date(event.data.object.current_period_end * 1000);
      //   if (event.data.object.plan.interval == 'month') {
      //     planData = await collectionPlan.findOne({ planIdMonth: event.data.object.plan.id });
      //   } else {
      //     planData = await collectionPlan.findOne({ planIdYear: event.data.object.plan.id });
      //   }
      //   plan = planData.name;
      //   await collection.updateOne(
      //     { customerId: event.data.object.customer },
      //     {
      //       $set: {
      //         subId: event.data.object.id,
      //         stripePlanId: event.data.object.plan.id,
      //         duration: event.data.object.plan.interval,
      //         endDate: date,
      //         plan,
      //         planId: planData._id
      //       }
      //     }
      //   );
      //   break;
      case "invoice.paid":
        date = new Date(event.data.object.lines.data[0].period.end * 1000);
        console.log(date);
        planData = await collection.findOne({
          customerId: event.data.object.customer,
        });
        if (event.data.object.status == "paid") {
          status = "success";
        } else {
          status = "failed";
        }
        var currentDat = new Date();

        var formattedDate = currentDat.toLocaleString("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
        });
        const updatePayment = await collectionPayment.insertOne({
          userId: String(planData._id),
          status,
          date: formattedDate,
          price: "$" + event.data.object.amount_paid / 100,
          paymentId: event.data.object.id,
        });

        await collection.updateOne(
          { customerId: event.data.object.customer },
          {
            $set: {
              endDate: date,
            },
          }
        );

        break;

      case "subscription_schedule.canceled":
        console.log("subscription_schedule.canceled", event.data.object);
        break;
      // case 'customer.subscription.deleted':
      //   console.log(event.data.object);
      //   const subData = await collection.findOne({ subId: event.data.object.id });
      //   if (subData == null) {
      //     if (event.data.object.plan.nickname == 'WhatsApp') {
      //       const deletePlan = await collection.updateMany(
      //         { customerId: event.data.object.customer },
      //         {
      //           $set: {
      //             nextIsWhatsapp: false
      //           }
      //         }
      //       );
      //     }
      //   } else {
      //     const changeStatus = await collection.updateOne(
      //       { customerId: event.data.object.customer },
      //       {
      //         $set: {
      //           status: 'cancel'
      //         }
      //       }
      //     );
      //   }

      //   break;
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
