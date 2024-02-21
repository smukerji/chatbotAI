import { NextResponse } from "next/server";
import { connectDatabase } from "@/db";
import { Stripe as s } from "stripe";
import { ObjectId } from "mongodb";
const stripe = new s(String(process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY));

export async function POST(req: any, res: NextResponse) {
  if (req.method === "POST") {
    try {
      const db = (await connectDatabase())?.db();
      let { plan, price, u_id } = await req.json();
      const collection = db.collection("users");
      const data = await collection.findOne({ _id: new ObjectId(u_id) });

      //ANCHOR - checking existing plan of user
      if (
        data.plan == "Agency Plan" ||
        (data.plan == "Individual Plan" && plan == 1)
      ) {
        return "You already have plan";
      }
      const h = data.paymentId;
      if (h) {
        let amount: number = price * 100;

        //ANCHOR - stripe payment intent creation
        const paymentIntent = await stripe.paymentIntents.create({
          amount: amount,
          currency: "inr",
          automatic_payment_methods: {
            enabled: true,
          },
          // confirm:true,
          customer: data.customerId,
          payment_method: data.paymentId,
          receipt_email: data.email,
        });

        return NextResponse.json(paymentIntent);
      } else {
        return NextResponse.json({ status: 500 });
      }
    } catch (error) {
      console.error(error);
      return NextResponse.json(error);
    }
  } else {
    console.log("error");
  }
}

export async function PUT(req: any, res: NextResponse) {
  let { u_id } = await req.json();
  const db = (await connectDatabase())?.db();
  const collection = db.collection("users");
  const data = await collection.findOne({ _id: new ObjectId(u_id) });

  //ANCHOR - check current plan of the user
  if (data.plan == "Agency Plan") {
    return NextResponse.json({ msg: 2 });
  } else if (data.plan == "Individual Plan") {
    if (data.duration == "month") {
      return NextResponse.json({
        msg: 1,
        prePrice: 15,
        duration: data.duration,
      });
    } else {
      return NextResponse.json({
        msg: 1,
        prePrice: 144,
        duration: data.duration,
      });
    }
  } else {
    return NextResponse.json({ msg: 0 });
  }
}
