import { apiHandler } from "@/app/_helpers/server/api/api-handler";
import clientPromise from "@/db";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import Stripe from "stripe";

module.exports = apiHandler({
  // POST: createPaymentIntent,
  POST: getPlanPrices,
});

async function getPlanPrices(req: any, res: NextResponse) {
  try {
    let { u_id } = await req.json();
    const db = (await clientPromise!).db();
    const collection = db.collection("users");
    const data = await collection.findOne({ _id: new ObjectId(u_id) });
    const stripeKey: any = process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY;
    const stripe = new Stripe(stripeKey);

    // const priceId = data.stripePlanId;

    // if (!priceId) {
    //   return {
    //     status: 400,
    //     message: "No plan found",
    //   };
    // }

    const allPrices = await stripe.prices.list({ limit: 100 });

    // Filter and map the prices based on the priceId from the user's plan
    const filteredPrices = allPrices.data.map((price) => ({
      priceId: price.id,
      interval: price.recurring?.interval || "N/A",
      unit_amount: price.unit_amount,
    }));

    if (filteredPrices.length === 0) {
      return {
        status: 404,
        message: "No matching price found",
      };
    }

    return {
      status: 200,
      prices: filteredPrices,
    };
  } catch (error) {
    return {
      status: 500,
      message: "Internal Server Error",
      error: error,
    };
  }
}
