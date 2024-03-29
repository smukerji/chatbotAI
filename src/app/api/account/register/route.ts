import { NextResponse } from "next/server";
import clientPromise from "../../../../db";
import { apiHandler } from "../../../_helpers/server/api/api-handler";
import joi from "joi";
import bcrypt from "bcrypt";
import { useEmailService } from "../../../_services/emailService";
import {
  logo,
  logoBase64,
  registerationMail,
} from "../../../_helpers/emailImagesBase64Constants";

module.exports = apiHandler({
  POST: register,
});

async function register(request: any) {
  const body = await request.json();
  const { username, email, password } = body;
  const db = (await clientPromise!).db();
  const collection = db.collection("users");
  /// validate if user email already exists
  if (await collection.findOne({ email: email })) {
    throw 'Email "' + email + '" is already in use';
  }

  /// generate the password hash
  const saltRounds = 10;
  const hashPassword = await bcrypt.hash(password, saltRounds);
  let currentDate = new Date();
  let endDate = new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000);
  /// get the starter plan ID
  const starterPlan = await db
    .collection("plans")
    .findOne({ name: "individual" });

  /// register new user
  const userResult = await collection.insertOne({
    username,
    email,
    password: hashPassword,
    planId: starterPlan?._id,
    startDate: currentDate,
    isWhatsapp: true,
    endDate: endDate,
  });

  const userId = userResult?.insertedId.toString();

  /// set the user details
  await db.collection("user-details").insertOne({
    userId: userId,
    totalMessageCount: 0,
    messageLimit: starterPlan?.messageLimit,
    chatbotLimit: starterPlan?.numberOfChatbot,
    trainingDataLimit: starterPlan?.trainingDataLimit,
    websiteCrawlingLimit: starterPlan?.websiteCrawlingLimit,
  });

  /// send the registration mail
  const emailService = useEmailService();
  await emailService.send(
    "registration-mail-template",
    [
      registerationMail.heroImage,
      registerationMail.avatarIcon,
      registerationMail.icon1,
      registerationMail.icon2,
      logo,
    ],
    email,
    {
      name: username,
    }
  );

  return { message: "Registered successfully... Please login to continue" };
}

register.schema = joi.object({
  username: joi.string().required(),
  password: joi.string().min(6).required(),
  email: joi.string().required(),
});
