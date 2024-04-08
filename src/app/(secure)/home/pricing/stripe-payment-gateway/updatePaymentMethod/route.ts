import { NextResponse } from "next/server";
import clientPromise from "@/db";
import Stripe from "stripe";
import { ObjectId } from "mongodb";
import { apiHandler } from "@/app/_helpers/server/api/api-handler";
const stripe = new Stripe(String(process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY));

module.exports = apiHandler({
  POST: updateUserPaymentMethod,
});

async function updateUserPaymentMethod(req: any, res: NextResponse) {
  if (req.method === "POST") {
    try {
      let { paymentId, u_id } = await req.json();
      const db = (await clientPromise!).db();
      const collection = db.collection("users");

      //ANCHOR - Get data of user by user_id
      const data = await collection.findOne({ _id: new ObjectId(u_id) });

      //ANCHOR - attach paymentId with customerId
      const attachedPaymentMethod = await stripe.paymentMethods.attach(
        paymentId,
        {
          customer: data.customerId,
        }
      );

      //ANCHOR - update default payment method in customerId
      // await stripe.customers.update(data.customerId, {
      //   invoice_settings: {
      //     default_payment_method: paymentId,
      //   },
      // });

      //ANCHOR - update user data to add paymentId
      const result = await collection.updateOne(
        { _id: new ObjectId(u_id) },
        {
          $set: {
            paymentId: paymentId,
          },
        }
      );
      return result;
    } catch (error) {
      console.error(error);
      return error;
    }
  } else {
    console.log("error");
    return "invalid method";
  }
}
