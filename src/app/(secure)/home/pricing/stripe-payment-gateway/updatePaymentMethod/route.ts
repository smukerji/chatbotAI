import { NextApiRequest, NextApiResponse } from "next";
import { NextResponse } from "next/server";
import { connectDatabase } from "@/db";
import Stripe from "stripe";
const stripe = new Stripe(String(process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY));

export async function POST(req: any, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      let { paymentId } = await req.json();
      const db = (await connectDatabase())?.db();
      const collection = db.collection("users");
      let userId = "65c07c32e5cc6f17b42c2cb4";
      const data = await collection.findOne({ _id: userId });
      const result = await collection.updateOne(
        { _id: userId },
        {
          $set: {
            paymentId: paymentId,
          },
        }
      );
      console.log(result);
      return NextResponse.json(result);
    } catch (error) {
      console.error(error);
      // res.status(500).json({ error: 'Unable to create subscription' });
    }
  } else {
    // res.setHeader('Allow', ['POST']);
    // res.status(405).end('Method Not Allowed');
    console.log("error");
  }
}
