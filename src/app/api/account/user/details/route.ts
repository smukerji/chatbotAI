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
  const userCollection = await db
    .collection("users")
    .findOne({ _id: new ObjectId(userId) });

  /// get the plan name with the help of planId

  const planCollection = await db
    .collection("plans")
    .findOne({ _id: userCollection?.planId });
  // .aggregate([
  //   {
  //     $match: { _id: new ObjectId(userId) },
  //   },
  //   {
  //     $lookup: {
  //       from: "plans",
  //       localField: "planId",
  //       foreignField: "_id",
  //       as: "plan",
  //     },
  //   },
  // ])
  // .toArray();

  const userDetails = await db.collection("user-details").findOne({
    userId: userId,
  });

  /// split the first name and the last name
  let username = "",
    firstName = "",
    lastName = "";

  if (userCollection?.username) {
    username = userCollection?.username?.split("_");
    firstName = username[0];
    lastName = username[1];
  }

  return {
    plan: {
      name: planCollection?.name,
      messageLimit: userDetails?.messageLimit,
      numberOfChatbot: userDetails?.chatbotLimit,
      trainingDataLimit: userDetails?.trainingDataLimit,
      websiteCrawlingLimit: userDetails?.websiteCrawlingLimit,
    },
    noOfChatbotsUserCreated,
    userDetails,
    planExpiry: userCollection?.endDate,
    firstName: firstName,
    lastName: lastName,
    fullName: userCollection?.name ? userCollection?.name : "",
    email: userCollection?.email,
  };

  //   const chatbotCapacity = planDetails[0].plan[0].numberOfChatbot;
  //   if (noOfChatbotsUserCreated + 1 > chatbotCapacity)
  //     return res.status(200).send({
  //       status: "LIMITEXCEED",
  //       message: "Chatbot Creation Limit Exceed",
  //     });
}
