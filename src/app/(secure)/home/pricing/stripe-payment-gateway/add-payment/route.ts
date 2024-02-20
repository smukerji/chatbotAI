import { NextResponse } from "next/server";
import { connectDatabase } from "@/db";
import Stripe from "stripe";
import { ObjectId } from "mongodb";
const stripe = new Stripe(String(process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY));

export async function POST(req: any, res: NextResponse) {
  if (req.method === "POST") {
    try {
      let { plan, u_id, duration } = await req.json();
      const db = (await connectDatabase())?.db();

      //ANCHOR - Get data of user by user_id
      const collection = db.collection("users");
      let plan_name = null;
      if (plan == 1) {
        plan_name = "Individual Plan";
      } else {
        plan_name = "Agency Plan";
      }
      const collectionPlan = db.collection("plans");
      const plan_data = await collectionPlan.findOne({name: plan_name})
      console.log(plan_data)
      const currentDate = new Date();
      if (duration == "month") {
        const endDate = new Date(
          currentDate.getTime() + 30 * 24 * 60 * 60 * 1000
        );
        //ANCHOR - update data of user
        const data = await collection.updateMany(
          { _id: new ObjectId(u_id) },
          {
            $set: {
              plan: plan_name,
              startDate: currentDate,
              endDate: endDate,
              duration: duration,
              planId: plan_data?._id,
            },
          }
        );

        return NextResponse.json(data);
      } else {
        const endDate = new Date(
          currentDate.getTime() + 365 * 24 * 60 * 60 * 1000
        );
        //ANCHOR - update data of user
        const data = await collection.updateMany(
          { _id: new ObjectId(u_id) },
          {
            $set: {
              plan: plan_name,
              startDate: currentDate,
              endDate: endDate,
              duration: duration
            },
          }
        );

        return NextResponse.json(data);
      }

      //   //ANCHOR - update data of user
      //   const data = await collection.updateMany({ _id: new ObjectId(u_id) },{
      //     $set:{
      //         plan: plan_name,
      //         startDate: currentDate, // Add current date to documents
      //         endDate: endDate
      // }
      //   });

      //   return NextResponse.json(data);
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
