import { NextResponse } from "next/server";
import { connectDatabase } from "@/db";
import Stripe from "stripe";
import { ObjectId } from "mongodb";
import { apiHandler } from "@/app/_helpers/server/api/api-handler";
import { number } from "joi";

module.exports = apiHandler({
  POST: addPaymentDetails,
  PUT: addPaymentDetailsFail,
});

async function addPaymentDetailsFail(req: any, res: NextResponse) {
  let { u_id, status, paymentId, price } = await req.json();
  const db = (await connectDatabase())?.db();

  const collectionPayment = db.collection("payment-history");
  var currentDat = new Date();

  var formattedDate = currentDat.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
  const updatePayment = await collectionPayment.insertOne({
    userId: u_id,
    status,
    date: formattedDate,
    price: "$" + price,
    paymentId,
  });
}

async function addPaymentDetails(req: any, res: NextResponse) {
  if (req.method === "POST") {
    try {
      let { plan, u_id, duration, status, paymentId, price } = await req.json();
      const db = (await connectDatabase())?.db();

      //ANCHOR - Get data of user by user_id
      const collection = db.collection("users");
      const userData = await collection.findOne({ _id: new ObjectId(u_id) });
      let plan_name = null;

      //ANCHOR - add ons limit update
      const collectionAdd = db.collection("user-details");
      const userDataAdd = await collectionAdd.findOne({ userId: String(u_id) });

      //ANCHOR - storing payment details
      const collectionPayment = db.collection("payment-history");
      var currentDat = new Date();

      var formattedDate = currentDat.toLocaleString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      });
      const updatePayment = await collectionPayment.insertOne({
        userId: u_id,
        status,
        date: formattedDate,
        price: "$" + price,
        paymentId,
      });

      //ANCHOR - message limit update
      if (plan == 5) {
        const data = await collectionAdd.updateMany(
          { userId: String(u_id) },
          {
            $set: {
              trainingDataLimit:
                Number(userDataAdd?.trainingDataLimit) + 1000000,
            },
          }
        );
        return data;
      }

      //ANCHOR - character limit update
      if (plan == 6) {
        const data = await collectionAdd.updateMany(
          { userId: String(u_id) },
          {
            $set: {
              messageLimit: Number(userDataAdd?.messageLimit) + 5000,
            },
          }
        );
        return data;
      }

      //ANCHOR - plan name initialized
      if (plan == 1) {
        plan_name = "individual";
      } else {
        plan_name = "agency";
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
              nextPlanDuration: duration,
            },
          }
        );

        return data;
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
              nextPlanDuration: duration,
            },
          }
        );

        return data;
      }
    } catch (error) {
      console.error(error);
      return error;
    }
  } else {
    console.log("error");
  }
}
