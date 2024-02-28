import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "../../../../../db";
import { ObjectId } from "mongodb";
import { apiHandler } from "../../../../_helpers/server/api/api-handler";
module.exports = apiHandler({
  GET: userDetails,
});

async function userDetails(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const userId: string = params.get("userId")!;
  /// first check id user is able to create chatbot or not
  /// get the number of chatbot create by user
  const db = (await connectDatabase()).db();

  const noOfChatbotsUserCreated = await db
    .collection("user-chatbots")
    .countDocuments({ userId: userId });

  /// get the number of chatbot user can create from plan table
  const planDetails = await db
    .collection("users")
    .aggregate([
      {
        $match: { _id: new ObjectId(userId) },
      },
      {
        $lookup: {
          from: "plans",
          localField: "planId",
          foreignField: "_id",
          as: "plan",
        },
      },
    ])
    .toArray();

  const userDetails = await db.collection("user-details").findOne({
    userId: userId,
  });

  console.log("Fdssssssssssssssssssss",planDetails[0]);
  
  return {
    plan: planDetails[0].plan[0],
    noOfChatbotsUserCreated,
    userDetails,
    planExpiry:planDetails[0].endDate
  };
  //   const chatbotCapacity = planDetails[0].plan[0].numberOfChatbot;
  //   if (noOfChatbotsUserCreated + 1 > chatbotCapacity)
  //     return res.status(200).send({
  //       status: "LIMITEXCEED",
  //       message: "Chatbot Creation Limit Exceed",
  //     });
}
