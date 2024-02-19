import { NextApiRequest, NextApiResponse } from "next";
import { NextResponse } from "next/server";
import { connectDatabase } from "@/db";
import Stripe from "stripe";
const stripe = new Stripe(String(process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY));

export async function POST(req: any, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      let { plan } = await req.json();
      const db = (await connectDatabase())?.db();
      const collection = db.collection("users");
      let userId = "65c07a9dd73744ba62c1ea14";
      let plan_name = null
      if(plan == 1){
        plan_name = 'Individual Plan'
      }
      else{
        plan_name = 'Agency Plan'
      }
      //ANCHOR - Get data of user by user_id
      const data = await collection.updateMany({ _id: userId },{
        $set:{
            plan: plan_name,
              // Date(), { $multiply: [ 30, 24, 60, 60, 1000 ] 
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
