import { apiHandler } from "@/app/_helpers/server/api/api-handler";
import { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";

const cancelSubscription = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  const stripeKey: any = process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY;
  try {
    const stripe = new Stripe(stripeKey);
    const { subscriptionId } = req.body;

    const deletedSubscription = await stripe.subscriptions.cancel(
      subscriptionId
    );

    res.status(200).json({
      code: "subscription_deleted",
      deletedSubscription,
    });
  } catch (e) {
    console.error(e);
    res.status(400).json({
      code: "subscription_deletion_failed",
      error: e,
    });
  }
};

module.exports = apiHandler({
  DELETE: cancelSubscription,
});
