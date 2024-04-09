import { NextResponse } from "next/server";
import clientPromise from "../../../../db";
import { apiHandler } from "../../../_helpers/server/api/api-handler";
import joi from "joi";
import bcrypt from "bcrypt";
import { emailService } from "../../../_services/emailService";
import {
  logo,
  logoBase64,
  registerationMail,
} from "../../../_helpers/emailImagesBase64Constants";
import jwt ,{ Secret } from "jsonwebtoken";

module.exports = apiHandler({
  POST: register,
});

function generateJWTToken(email: string) {
  return jwt.sign({ email }, process.env.NEXT_PUBLIC_JWT_SECRET as Secret, {
    expiresIn: process.env.NEXT_PUBLIC_JWT_EXPIRES_IN,
  });
}

async function register(request: any) {
  const body = await request.json();
  const { username, email, password } = body;
  const db = (await clientPromise!).db();
  const collection = db.collection("users");
  /// validate if user email already exists
  const user = await collection.findOne({ email: email })
  if (user && user.isVerified == true) {
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
    isVerified: false
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
  // const temailService = emailService();
  // await temailService.send(
  //   "registration-mail-template",
  //   [
  //     registerationMail.heroImage,
  //     registerationMail.avatarIcon,
  //     registerationMail.icon1,
  //     registerationMail.icon2,
  //     logo,
  //   ],
  //   email,
  //   {
  //     name: username,
  //   }
  // );

  // //send the registration verification  email
  // const jwtToken = generateJWTToken(email);
  // const link = `${process.env.NEXT_PUBLIC_WEBSITE_URL}/verify-email?jwt=${jwtToken}`
  // await temailService.send(
  //   "verify-email-register-template",
  //   [],
  //   email,
  //   {
  //     link: link,
  //   }
  // );

  return { message: "Please check your email  to verify your account." };
}

register.schema = joi.object({
  username: joi.string().required(),
  password: joi.string().min(6).required(),
  email: joi.string().required(),
});
