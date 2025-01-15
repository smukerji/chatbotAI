import { apiHandler } from "@/app/_helpers/server/api/api-handler";
import clientPromise from "@/db";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(String(process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY));

module.exports = apiHandler({
  POST: getPaymentHistory,
});

async function addProductNamesToSubscriptions(subscriptions: any) {
  // Loop through each subscription object
  for (const subscription of subscriptions) {
    // Loop through each item in the 'data' array
    for (const item of subscription.data) {
      const productId = item.product;

      try {
        const product = await stripe.products.retrieve(productId);

        item.name = product.metadata.name;
      } catch (error) {
        console.error(`Failed to retrieve product for ID: ${productId}`, error);
      }
    }
  }
  return subscriptions;
}

async function getPaymentHistory(req: any, res: NextResponse) {
  try {
    const db = (await clientPromise!).db();
    let { u_id } = await req.json();
    const collectionUser = db.collection("users");
    const data = await collectionUser.findOne({ _id: new ObjectId(u_id) });

    // const paymentDetails = await cursor.toArray();

    if (!data.customerId) {
      return {
        msg: "No payment history found",
        paymentDetails: [],
      };
    }

    const subscriptions = await stripe.subscriptions.list({
      limit: 100,
      customer: data.customerId,
    });

    // Assuming `subscriptions` is your array of subscription objects
    const extractedSubscriptions = subscriptions.data.map((subscription) => {
      const { latest_invoice, items } = subscription;

      // Extract data and total_count from items
      const { data, total_count }: any = items;

      // From each item in data, extract only the 'plan' information you need
      const extractedData = data.map((item: any) => {
        const { active, amount, created, product } = item.plan;
        return { active, amount, created, product };
      });

      // Return only the fields you need in each subscription
      return {
        latest_invoice,
        total_count,
        data: extractedData,
      };
    });

    // Now extractedSubscriptions contains only the needed information

    // Await the completion of addProductNamesToSubscriptions
    const updatedSubscriptions = await addProductNamesToSubscriptions(
      extractedSubscriptions
    );
    const paymentDetails = updatedSubscriptions;

    return {
      paymentDetails,
    };
  } catch (error) {}
}
