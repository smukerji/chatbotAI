import { NextApiRequest, NextApiResponse } from "next";
import { NextResponse } from "next/server";
import { connectDatabase } from "@/db";
import { StripeElements, loadStripe, Stripe } from "@stripe/stripe-js";
import { Stripe as s } from "stripe";
import { Console } from "console";
const stripe = new s(String(process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY));

export async function POST(req: any, res: NextApiResponse) {
  const stripee = (await loadStripe(
    String(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY)
  )) as Stripe;
  if (req.method === "POST") {
    try {
      const db = (await connectDatabase())?.db();
      let { plan } = await req.json();
      const collection = db.collection("users");
      let userId = "65c07a9dd73744ba62c1ea14";
      const data = await collection.findOne({ _id: userId });
      if((data.plan == 'Agency Plan') || (data.plan == 'Individual Plan' && plan == 1)){
        return "You already have plan";
      }
      
      const h = data.paymentId;
      if (h) {
        let amount: number = 0;
        if (plan == 2) {
          amount = 8900;
        } else {
          amount = 1500;
        }
        //ANCHOR - stripe payment intent creation
        const paymentIntent = await stripe.paymentIntents.create({
          amount: amount,
          currency: "inr",
          automatic_payment_methods: {
            enabled: true,
          },
          customer: data.customerId,
          payment_method: data.paymentId,
        });

        return NextResponse.json(paymentIntent);
      } else {
        return NextResponse.json({ status: 500 });
      }
    } catch (error) {
      console.error(error);
    }
  } else {
    // res.setHeader('Allow', ['POST']);
    // res.status(405).end('Method Not Allowed');
    console.log("error");
  }
}

//ANCHOR - checking that user has payment-methodId or not
export async function GET(req: NextApiRequest, res: NextApiResponse) {
  const db = (await connectDatabase())?.db();
  const collection = db.collection("users");
  let userId = "65c07a9dd73744ba62c1ea14";
  const data = await collection.findOne({ _id: userId });
  const h = data.paymentId;

  //ANCHOR - check that paymentId available or not
  if (h != undefined) {
    return NextResponse.json("success");
  } else {
    return NextResponse.json({ status: 500 });
  }
}

export async function PUT(req: NextApiRequest, res: NextApiResponse) {
  const db = (await connectDatabase())?.db();
  const collection = db.collection("users");
  let userId = "65c07a9dd73744ba62c1ea14";
  const data = await collection.findOne({ _id: userId });
  
  //ANCHOR - check current plan of the user
  if((data.plan == 'Agency Plan') ){
    return NextResponse.json({msg:2});
  }
  else if(data.plan == 'Individual Plan'){
    return NextResponse.json({msg:1})
  }
  else{
    return NextResponse.json({msg:0})
  }

}