import { NextApiRequest, NextApiResponse } from "next";
import { NextResponse } from "next/server";
import { connectDatabase } from "@/db";
import Stripe from "stripe";
const stripe = new Stripe(String(process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY));

export async function POST(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      const db = (await connectDatabase())?.db();
      const collection = db.collection("users");
      let userId = "65c07c32e5cc6f17b42c2cb4";
      const data = await collection.findOne({ _id: userId });
      if (data?.customerId != null) {
        console.log(data);
        return NextResponse.json(data.customerId);
      } else {
        console.log(data)
        const customer = await stripe.customers.create({
          email: data.email,
          name: data.username,
        });
        const add = await collection.updateOne(
          { _id: userId },
          {
            $set: {
              customerId: customer.id,
            },
          }
        );
        return NextResponse.json(customer.id);
      }
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
