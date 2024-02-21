// import { NextApiRequest, NextApiResponse } from "next";
import { NextResponse } from "next/server";
import { connectDatabase } from "@/db";
import Stripe from "stripe";
import { ObjectId } from "mongodb";
const stripe = new Stripe(String(process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY));

export async function POST(req: any, res: NextResponse) {
  if (req.method === "POST") {
    try {
      let { u_id } = await req.json();
      const db = (await connectDatabase())?.db();
      const collection = db.collection("users");
      const data = await collection.findOne({ _id: new ObjectId(u_id) });

      //ANCHOR - checking that user has customerId or not
      if (data?.customerId != null) {
        return NextResponse.json(data.customerId);
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
        return NextResponse.json({ message: "success" });
      }
    } catch (error) {
      console.error(error);
      return NextResponse.json(error);
      // res.status(500).json({ error: 'Unable to create subscription' });
    }
  } else {
    console.log("error");
  }
}
