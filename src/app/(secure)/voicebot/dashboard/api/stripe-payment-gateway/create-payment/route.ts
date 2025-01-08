import { apiHandler } from "@/app/_helpers/server/api/api-handler";
import clientPromise from "@/db";
import { ObjectId } from "mongodb";
import { NextApiResponse } from "next";
import Stripe from "stripe";

const stripeKey: any = process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY;
const stripe = new Stripe(stripeKey);

const calculateCredits = (amount: number) => {
  const thirtyPercent = amount * 0.3; // Calculate 30% of the amount
  const credits = amount - thirtyPercent; // Subtract 30% from the amount
  return credits;
};

const createPayment = async (req: any, res: NextApiResponse) => {
  const { amount, paymentMethodId, u_id } = req.json();
  const db = (await clientPromise!).db();
  const collection = db.collection("users");
  const data = await collection.findOne({ _id: new ObjectId(u_id) });
  let customerId;

  if (amount <= 0) {
    return {
      msg: "Please, enter valid amount.",
    };
  }

  //ANCHOR - checking that user has customerId or not
  if (data?.customerId != null) {
    customerId = data.customerId;
  } else {
    //ANCHOR - create user's customerId
    const customer = await stripe.customers.create({
      email: data.email,
      name: data.username,
    });
    const add = await collection.updateOne(
      { _id: new ObjectId(u_id) },
      {
        $set: {
          customerId: customer.id,
        },
      }
    );

    customerId = customer.id;
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: "usd", // Replace with your currency
      payment_method_types: ["card"],
      payment_method: paymentMethodId,
      customer: customerId,
      metadata: {
        credits: calculateCredits(amount), // Optional: Map amount to credits
        userId: u_id,
        type: "credit",
      },
    });

    return {
      msg: "Payment created successfully.",
      clientSecret: paymentIntent.client_secret,
    };
  } catch (error) {
    return {
      code: "payment_creation_failed",
      error: error,
    };
  }
};

module.exports = apiHandler({
  POST: createPayment,
});
