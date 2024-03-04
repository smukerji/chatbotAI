import { NextResponse } from "next/server";
import { connectDatabase } from "@/db";
import Stripe from "stripe";
import { ObjectId } from "mongodb";
import { apiHandler } from "@/app/_helpers/server/api/api-handler";
import { number } from "joi";

module.exports = apiHandler({
  POST: getUserDetails,
  PUT: delPlan,
});

async function getUserDetails(req: any, res: NextResponse) {
  try {
    const db = (await connectDatabase())?.db();
    let { u_id } = await req.json();
    const collectionUser = db.collection("users");
    const collectionPayment = db.collection("payment-history");
    const collectionPlan = db.collection("plans");
    const collectionUserDetails = db.collection("users");
    const data = await collectionUser.findOne({ _id: new ObjectId(u_id) });
    const planId = data.planId;
    const data_plan = await collectionPlan.findOne({ _id: planId });

    const cursor = await collectionPayment.find({ userId: u_id });
    const paymentDetails = await cursor.toArray();

    /// close the cursor
    await cursor.close();
    return {
      plan: data.plan,
      nextRenewal: data.endDate,
      message: data_plan.messageLimit,
      chatbot: data_plan.numberOfChatbot,
      duration: data.duration,
      paymentDetails,
      nextPlan: data.nextPlan,
    };
  } catch (error) {}
}

async function delPlan(req: any, res: NextResponse) {
  try {
    const db = (await connectDatabase())?.db();
    let { u_id } = await req.json();
    const collectionUser = db.collection("users");
    const deletePlan = await collectionUser.updateMany(
      { _id: new ObjectId(u_id) },
      {
        $set: {
          nextPlan: "",
          nextPlanId: "",
          nextPlanDuration: "",
        },
      }
    );
    return { msg: "Plan deleted successfully", status: true };
  } catch (error) {
    return { msg: "finding error", status: 0 };
  }
}
