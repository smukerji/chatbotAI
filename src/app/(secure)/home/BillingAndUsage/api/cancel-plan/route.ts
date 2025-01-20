import { apiHandler } from "@/app/_helpers/server/api/api-handler";
import clientPromise from "@/db";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import Stripe from "stripe";

module.exports = apiHandler({
  PUT: delPlan,
});

const stripeKey: any = process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY;

async function delPlan(req: any, res: NextResponse) {
  try {
    const stripe = new Stripe(stripeKey);

    const db = (await clientPromise!)?.db();
    let { u_id } = await req.json();
    const collectionUser = db.collection("users");
    const collectionData = db.collection("user-details");

    const userData = await collectionUser.findOne({
      _id: new ObjectId(u_id),
    });

    const Details = await collectionData.findOne({
      userId: String(userData._id),
    });

    if (!Details) {
      return { msg: "Addon details not found." };
    }

    const subscriptionId = userData.subId;

    if (!subscriptionId) {
      return { msg: "Subscription not found", status: 0 };
    }

    // Retrieve the subscription schedule
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    console.log(" subscriptttttt", subscription);

    if (subscription.schedule) {
      // If the subscription is managed by a schedule
      const scheduleId: any = subscription.schedule;

      // Update the subscription schedule to cancel at the end of the period
      const updatedSchedule = await stripe.subscriptionSchedules.update(
        scheduleId,
        {
          end_behavior: "cancel", // Ensures the subscription is canceled at the end of the current period
          metadata: {
            cancel_at_period_end: "true",
          },
        }
      );

      console.log("Updated subscription schedule:", updatedSchedule);
    } else {
      // Schedule cancellation at the end of the billing period
      const updatedSubscription = await stripe.subscriptions.update(
        subscriptionId,
        {
          cancel_at_period_end: true,
          metadata: {
            cancellation_scheduled: "true",
          },
        }
      );

      console.log("updated", updatedSubscription);
    }

    //ANCHOR -  DELETE PLAN FROM USER DETAILS

    await collectionUser.updateMany(
      { _id: new ObjectId(u_id) },
      {
        $set: {
          isNextPlan: false,
        },
      }
    );

    await collectionData.updateMany(
      { userId: String(userData?._id) },
      {
        $set: {
          isNextWhatsapp: false,
          isNextTelegram: false,
          isNextSlack: false,
          isNextConversationHistory: false,
        },
      }
    );

    return { msg: "Plan deleted successfully", status: true };
  } catch (error) {
    return { msg: "finding error", status: 0, error };
  }
}
