import { NextResponse } from "next/server";
import { connectDatabase } from "@/db";
import Stripe from "stripe";
import { ObjectId } from "mongodb";
import { apiHandler } from "@/app/_helpers/server/api/api-handler";
import { number } from "joi";

module.exports = apiHandler({
  POST: getUserDetails,
});

async function getUserDetails(req: any, res: NextResponse) {
  try {
    const db = (await connectDatabase())?.db();
    let { u_id } = await req.json();
    const collectionUser = db.collection("users");
    const collectionPlan = db.collection("plans");
    const collectionUserDetails = db.collection("users");
    const data = await collectionUser.findOne({ _id: new ObjectId(u_id) });
    const planId = data.planId
    const data_plan = await collectionPlan.findOne({ _id: planId });
    console.log(data, data_plan)
    return {plan: data.plan, nextRenewal: data.endDate, message: data_plan.messageLimit, chatbot: data_plan.numberOfChatbot}
  } catch (error) {}
}
