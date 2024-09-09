import { apiHandler } from "@/app/_helpers/server/api/api-handler";
import clientPromise from "@/db";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import Stripe from "stripe";

module.exports = apiHandler({
  PUT: delPlan,
  POST: getAddonDetail,
});

const stripeKey: any = process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY;

async function delPlan(req: any, res: NextResponse) {
  try {
    const stripe = new Stripe(stripeKey);

    const db = (await clientPromise!)?.db();
    let { u_id, price_id } = await req.json();
    const collectionUser = db.collection("users");
    const userData = await collectionUser.findOne({
      _id: new ObjectId(u_id),
    });

    const subscriptionId = userData.subId;

    if (!subscriptionId) {
      return { msg: "Subscription not found", status: 0 };
    }

    // Retrieve the current subscription
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    // Find the subscription item that matches the price_id
    const subscriptionItem: any = subscription.items.data.find(
      (item) => item.price.id === price_id
    );

    if (!subscriptionItem) {
      return { msg: "Plan not found", status: 0 };
    }

    // const productId: string = subscriptionItem.plan.product;

    // const product = await stripe.products.retrieve(productId);
    // console.log("jjjjjjjjjjjjj", product);

    //ANCHOR -  DELETE PLAN FROM USER DETAILS

    const updatedItems = subscription.items.data.map((item) => {
      if (item.price.id === price_id) {
        // Mark this item for removal
        return { id: item.id, quantity: 0 };
      }
      return { id: item.id, quantity: item.quantity };
    });

    if (updatedItems.length === 0) {
      return {
        msg: "Cannot remove all items from the subscription",
        status: 0,
      };
    }

    // Update subscription with only the remaining items after the billing period ends
    const updatedSubscription = await stripe.subscriptions.update(
      userData.subId,
      {
        proration_behavior: "none", // Prevent immediate changes
        items: updatedItems, // Keep remaining subscription items
      }
    );

    if (!updatedSubscription) {
      return { msg: "subscription was not updated", status: 0 };
    }

    return { msg: "Plan deleted successfully", status: true };
  } catch (error) {
    return { msg: "finding error", status: 0, error };
  }
}

async function getAddonDetail(req: any, res: NextResponse) {
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
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    if (!subscription) {
      return { msg: "Subscription not found", status: 0 };
    }

    const plans = subscription.items.data;

    // Map over subscription data and return only the 'plan' field
    const subscriptionData = plans.map((item) => item.plan);

    return {
      subscriptionData: subscriptionData,
      endDate: subscription.current_period_end,
    };
  } catch (error) {
    return { msg: "finding error", status: 0 };
  }
}
