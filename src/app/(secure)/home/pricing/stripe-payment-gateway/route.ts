import { NextResponse } from "next/server";
import clientPromise from "@/db";
import { Stripe as s } from "stripe";
import { ObjectId } from "mongodb";
import { apiHandler } from "@/app/_helpers/server/api/api-handler";
const stripe = new s(String(process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY));

module.exports = apiHandler({
  POST: createPaymentIntent,
  PUT: checkCurrentPlan,
});

async function createPaymentIntent(req: any, res: NextResponse) {
  if (req.method === "POST") {
    try {
      const db = (await clientPromise!).db();
      let { plan, price, u_id } = await req.json();
      const collection = db.collection("users");
      const data = await collection.findOne({ _id: new ObjectId(u_id) });
      let currentDate = new Date();
      //ANCHOR - checking existing plan of user
      if (
        data.plan == "individual" &&
        data.endDate > currentDate &&
        plan == 1 &&
        plan == 3
      ) {
        return "You already have plan";
      }
      const h = data.paymentId;
      if (h) {
        let amount: number = price * 100;

        //ANCHOR - stripe payment intent creation
        const paymentIntent = await stripe.paymentIntents.create({
          amount: amount,
          currency: "usd",
          automatic_payment_methods: {
            enabled: true,
          },
          customer: data.customerId,
          payment_method: data.paymentId,
          receipt_email: data.email,
        });
        return paymentIntent;
      } else {
        return { status: 500 };
      }
    } catch (error) {
      console.error(error);
      return error;
    }
  } else {
    console.log("error");
  }
}

async function checkCurrentPlan(req: any, res: NextResponse) {
  let { u_id } = await req.json();
  const db = (await clientPromise!).db();
  const collection = db.collection("users");
  const data = await collection.findOne({ _id: new ObjectId(u_id) });
  let currentDate = new Date();
  const date2: any = new Date(data.endDate);
  const date1: any = new Date();

  const differenceMs = date2 - date1;
  const differenceDays = Math.round(differenceMs / (1000 * 60 * 60 * 24));
  //ANCHOR - check current plan of the user
  if (data.endDate > currentDate) {
    if (data.plan) {
      return {
        msg: 1,
        prePrice: 15,
        duration: data.duration,
        text: "Current Plan",
        whatsAppIntegration: data.isWhatsapp,
      };
    } else {
      return {
        msg: 1,
        prePrice: 15,
        duration: data.duration,
        text: `Trial Expiring in ${differenceDays} Days`,
        whatsAppIntegration: true,
      };
    }
  } else {
    return {
      msg: 0,
      text: "Get started",
      whatsAppIntegration: data.isWhatsapp,
    };
  }
}
