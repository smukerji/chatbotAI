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
    const userData = await collectionUser.findOne({
      _id: new ObjectId(u_id),
    });

    const subscriptionId = userData.subId;

    if (!subscriptionId) {
      return { msg: "Subscription not found", status: 0 };
    }

    //ANCHOR -  DELETE PLAN FROM USER DETAILS

    // Schedule cancellation at the end of the billing period
    const updatedSubscription = await stripe.subscriptions.update(
      subscriptionId,
      {
        cancel_at_period_end: true,
      }
    );

    // const deletePlan = await collectionUser.updateMany(
    //   { _id: new ObjectId(u_id) },
    //   {
    //     $set: {
    //       status: "cancel",
    //       nextIsWhatsapp: false,
    //     },
    //   }
    // );

    return { msg: "Plan deleted successfully", status: true };
  } catch (error) {
    return { msg: "finding error", status: 0 };
  }
}
