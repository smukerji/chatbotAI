import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@/db";
import { ObjectId } from "mongodb";
import { apiHandler } from "@/app/_helpers/server/api/api-handler";

module.exports = apiHandler({
  POST: checkUserPaymentMethod,
  GET: getPlanDetails,
});

//ANCHOR - getting all plan details
async function getPlanDetails(req: NextRequest, res: NextResponse) {
  try {
    const db = (await connectDatabase())?.db();
    const collection = db.collection("plans");
    const data = await collection.find().toArray();
    return data;
  } catch (error) {
    return error;
  }
}
//ANCHOR - checking that user has payment-methodId or not
async function checkUserPaymentMethod(req: any, res: NextResponse) {
  let { u_id } = await req.json();
  const db = (await connectDatabase())?.db();
  const collection = db.collection("users");
  const user = await collection.findOne({ _id: new ObjectId(u_id) });
  const h = user.paymentId;

  //ANCHOR - check that paymentId available or not
  if (h != undefined) {
    return "success";
  } else {
    return { status: 500 };
  }
}
