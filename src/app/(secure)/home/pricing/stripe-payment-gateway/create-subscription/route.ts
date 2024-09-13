import { apiHandler } from "@/app/_helpers/server/api/api-handler";
import clientPromise from "@/db";
import { ObjectId } from "mongodb";
import { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";

const createSubscription = async (req: any, res: NextApiResponse) => {
  const stripeKey: any = process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY;
  try {
    const stripe = new Stripe(stripeKey);

    const { customerId, priceId, u_id } = req.json();

    const db = (await clientPromise!).db();
    const collection = db.collection("users");
    const data = await collection.findOne({ _id: new ObjectId(u_id) });

    const subId = data.subId;

    if (subId) {
      const existingSubscription = await stripe.subscriptions.retrieve(subId);
      const status = existingSubscription.status;

      if (status == "active") {
        return {
          msg: "Subscription already exists. You can upgrade it only.",
          subscriptionId: existingSubscription.id,
          alreadyExist: true,
        };
      }
    }

    // console.log("customer id ", customerId);

    const pricePlans = priceId.map((price: string) => {
      return {
        price: price,
      };
    });

    const subscription: any = await stripe.subscriptions.create({
      customer: customerId,
      items: pricePlans,
      payment_behavior: "default_incomplete",
      expand: ["latest_invoice.payment_intent"],
    });

    // Optional but recommended
    // Save the subscription object or ID to your database

    // Send the subscription ID and a client secret that the
    // Stripe subscription API creates. The subscription ID
    // and client secret will be used to
    // complete the payment on the frontend later.

    // Get the PaymentIntent and its clientSecret
    const paymentIntent = subscription?.latest_invoice?.payment_intent;

    console.log("paymentintetttt", paymentIntent);

    return {
      code: "subscription_created",
      subscriptionId: subscription.id,
      price: subscription.items.data.reduce(
        (acc: any, current: any) => acc + current?.plan?.amount,
        0
      ),
      clientSecret: paymentIntent.client_secret,
      invoice: subscription.latest_invoice.id,
      createDate: subscription.start_date,
      alreadyExist: false,
      paymentIntentStatus: paymentIntent.status,
    };
  } catch (e) {
    console.error(e);

    return {
      code: "subscription_creation_failed",
      error: e,
    };
  }
};

module.exports = apiHandler({
  POST: createSubscription,
});
