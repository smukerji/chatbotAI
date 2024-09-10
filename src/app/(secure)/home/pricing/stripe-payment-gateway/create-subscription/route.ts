import { apiHandler } from "@/app/_helpers/server/api/api-handler";
import { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";

const createSubscription = async (req: any, res: NextApiResponse) => {
  const stripeKey: any = process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY;
  try {
    const stripe = new Stripe(stripeKey);

    const { customerId, priceId } = req.json();

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
