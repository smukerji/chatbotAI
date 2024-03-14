import { NextResponse } from "next/server";
import clientPromise from "@/db";
import { ObjectId } from "mongodb";
import { apiHandler } from "@/app/_helpers/server/api/api-handler";

module.exports = apiHandler({
  POST: addPaymentDetails,
  PUT: addPaymentDetailsFail,
});

async function addPaymentDetailsFail(req: any, res: NextResponse) {
  let { u_id, status, paymentId, price } = await req.json();
  const db = (await clientPromise!).db();

  const collectionPayment = db.collection("payment-history");
  const collectionPurchase = db.collection("purchase");
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
      let {
        plan,
        u_id,
        duration,
        status,
        paymentId,
        price,
        isWhatsapp,
        isSlack,
      } = await req.json();
      const db = (await clientPromise!)?.db();

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
      //ANCHOR - character limit update
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

      //ANCHOR - message limit update

      if (plan == 7) {
        const data = await collectionAdd.updateMany(
          { userId: String(u_id) },
          {
            $set: {
              messageLimit: Number(userDataAdd?.messageLimit) + 10000,
            },
          }
        );
        return data;
      }

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
      if (plan == 9) {
        const data = await collectionAdd.updateMany(
          { userId: String(u_id) },
          {
            $set: {
              isSlack: true,
              nextIsSlack: true,
            },
          }
        );
        return data;
      }
     
      if (plan == 10) {
        const data = await collectionAdd.updateMany(
          { userId: String(u_id) },
          {
            $set: {
              isTelegram: true,
              nextIsTelegram: true
            }
          }
        );
        return data;
      }
    
      if (plan == 11) {
        const data = await collectionAdd.updateMany(
          { userId: String(u_id) },
          {
            $set: {
              isHubspot: true,
              nextIsHubspot: true
            }
          }
        );
        return data;
      }

      if (plan == 8) {
        const data = await collection.updateMany(
          { _id: new ObjectId(u_id) },
          {
            $set: {
              isWhatsapp: true,
              nextIsWhatsapp: true,
            },
          }
        );
        return data;
      }

      //ANCHOR - plan name initialized
      if (plan == 1 || plan == 3) {
        plan_name = 'individual';
      } else {
        plan_name = "agency";
      }

      //ANCHOR - getting plan details
      const collectionPlan = db.collection("plans");
      const plan_data = await collectionPlan.findOne({ name: plan_name });
      let currentDate = new Date();
      if (userData?.endDate > currentDate && userData.plan == "") {
        currentDate = userData.startDate;
        const updateUserDetails = await collectionAdd.updateMany(
          { userId: String(u_id) },
          {
            $set: {
              totalMessageCount: userDataAdd.totalMessageCount,
              chatbotLimit:
                Number(plan_data.numberOfChatbot) +
                Number(userDataAdd.chatbotLimit) -
                1,
              messageLimit:
                Number(plan_data.messageLimit) +
                Number(userDataAdd.messageLimit) -
                2000,
              trainingDataLimit:
                Number(plan_data.trainingDataLimit) +
                Number(userDataAdd.trainingDataLimit) -
                1000000,
              websiteCrawlingLimit:
                Number(plan_data.websiteCrawlingLimit) +
                Number(userDataAdd.websiteCrawlingLimit) -
                10,
            },
          }
        );
      } else {
        currentDate = new Date();
        const endDate = new Date(
          currentDate.getTime() + 30 * 24 * 60 * 60 * 1000
        );
        const updateUserDetails = await collectionAdd.updateMany(
          { userId: String(u_id) },
          {
            $set: {
              totalMessageCount: 0,
              chatbotLimit: plan_data.numberOfChatbot,
              messageLimit: plan_data.messageLimit,
              trainingDataLimit: plan_data.trainingDataLimit,
              websiteCrawlingLimit: plan_data.websiteCrawlingLimit,
              limitEndDate: endDate,
              isSlack,
              nextIsSlack: isSlack,
            },
          }
        );
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
              isWhatsapp,
              nextIsWhatsapp: isWhatsapp,
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
              isWhatsapp,
              nextIsWhatsapp: isWhatsapp,
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
