import { NextResponse } from "next/server";
import { connectDatabase } from "@/db";
import Stripe from "stripe";
import { ObjectId } from "mongodb";

export async function POST(req: any, res: NextResponse) {
  if (req.method === "POST") {
    try {
      let { plan, u_id, duration } = await req.json();
      const db = (await connectDatabase())?.db();

      //ANCHOR - Get data of user by user_id
      const collection = db.collection("users");
      const userData = await collection.findOne({ _id: new ObjectId(u_id) });
      let plan_name = null;

      //ANCHOR - plan name initialized
      if (plan == 1) {
        plan_name = "Individual Plan";
      } else {
        plan_name = "Agency Plan";
      }

      //ANCHOR - getting plan details
      const collectionPlan = db.collection("plans");
      const plan_data = await collectionPlan.findOne({ name: plan_name });
      let currentDate = null;
      if (userData?.startDate != null) {
        currentDate = userData.startDate;
      } else {
        currentDate = new Date();
      }
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
              nextPlan: plan_name,
              nextPlanId: plan_data?._id,
              nextPlanDuration: duration
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
              duration: duration,
              planId: plan_data?._id,
              nextPlan: plan_name,
              nextPlanId: plan_data?._id,
              nextPlanDuration: duration
            },
          }
        );

        return NextResponse.json(data);
      }
    } catch (error) {
      console.error(error);
      return NextResponse.json(error);
    }
  } else {
    console.log("error");
  }
}
