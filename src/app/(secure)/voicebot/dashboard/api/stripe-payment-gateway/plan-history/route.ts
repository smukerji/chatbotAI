import { apiHandler } from "@/app/_helpers/server/api/api-handler";
import clientPromise from "@/db";
import { ObjectId } from "mongodb";
import { NextApiResponse } from "next";
import Stripe from "stripe";

const stripeKey: any = process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY;
const stripe = new Stripe(stripeKey);

const getPaymentHistory = async (req: any, res: NextApiResponse) => {
  const { u_id } = req.json();
  const db = (await clientPromise!).db();
  const collection = db.collection("users");
  const data = await collection.findOne({ _id: new ObjectId(u_id) });

  if (!u_id) {
    return {
      status: 400,
      message: "User ID is required",
    };
  }

  if (!data.customerId) {
    return {
      status: 400,
      message: "No Record Found",
    };
  }

  let allCreditPayments = [];
  let hasMore = true;
  let startingAfter = null;

  while (hasMore) {
    const params: any = {
      limit: 100,
      customer: data.customerId, // Fetch payments for a specific customer
    };

    if (startingAfter) {
      params.starting_after = startingAfter; // Add `starting_after` only if it has a value
    }

    const paymentIntents = await stripe.paymentIntents.list(params);

    // Filter only credit-related payments using metadata
    // Filter and map in a single step
    const creditPayments = paymentIntents.data
      .filter((intent) => intent.metadata?.type === "credit") // Filter for credit type
      .map((intent) => ({
        id: intent.id,
        amount: intent.amount,
        created: intent.created,
        status: intent.status,
      }));

    console.log("creditPayments", creditPayments);

    allCreditPayments.push(...creditPayments);

    // Check if there are more pages
    hasMore = paymentIntents.has_more;
    if (hasMore) {
      startingAfter = paymentIntents.data[paymentIntents.data.length - 1].id;
    }
  }

  try {
    return {
      msg: "Payment history fetched successfully.",
      paymentDetails: allCreditPayments,
    };
  } catch (error) {
    return {
      code: "Error fetching billing info",
      error: error,
    };
  }
};

module.exports = apiHandler({
  POST: getPaymentHistory,
});
