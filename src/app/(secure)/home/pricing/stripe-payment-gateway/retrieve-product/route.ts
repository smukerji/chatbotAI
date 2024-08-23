import { apiHandler } from "@/app/_helpers/server/api/api-handler";
import { NextResponse } from "next/server";
import Stripe from "stripe";

module.exports = apiHandler({
  GET: retrievePlan,
});

async function retrievePlan(req: any, res: NextResponse) {
  const stripeKey: any = process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY;

  try {
    const stripe = new Stripe(stripeKey);

    const priceId = req.nextUrl.searchParams.get("priceId");

    const price = await stripe.prices.retrieve(priceId);

    return {
      status: 200,
      data: price,
    };
  } catch (error) {
    console.log(error);

    return {
      status: 500,
      error: error,
    };
  }
}
