import { NextApiRequest, NextApiResponse } from "next";
import { NextResponse } from "next/server";
import { connectDatabase } from "@/db";
import Stripe from "stripe";
import { ObjectId } from "mongodb";
const stripe = new Stripe(String(process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY));

export async function POST(req: any, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      let { plan ,u_id} = await req.json();
      const db = (await connectDatabase())?.db();
      const collection = db.collection("users");
      let plan_name = null
      if(plan == 1){
        plan_name = 'Individual Plan'
      }
      else{
        plan_name = 'Agency Plan'
      }
      //ANCHOR - Get data of user by user_id
      const currentDate = new Date();
      const endDate = new Date(currentDate.getTime() + (30 * 24 * 60 * 60 * 1000));
      const data = await collection.updateMany({ _id: new ObjectId(u_id) },{
        $set:{
            plan: plan_name,
            startDate: currentDate, // Add current date to documents
            endDate: endDate
    }
      });

      return NextResponse.json(data);
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
