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
import jwt, { Secret } from "jsonwebtoken";

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
  let msg;
  const { username, email, password } = body;
  const db = (await clientPromise!).db();
  const collection = db.collection("users");
  /// validate if user email already exists
  const user = await collection.findOne({ email: email });
  const temailService = emailService();
  if (user) {
    if (user?.isVerified == true) {
      throw 'Email "' + email + '" is already in use';
    } else if (user?.isVerified == false) {
      msg =
        "This email is already registered kindly check your email to verify";
    } else if (user?.image) {
      throw "This email is already used by a social account.";
    } else {
      msg =
        "This email is already registered kindly check your email to verify";
    }
  } else {
    /// generate the password hash
    const saltRounds = 10;
    const hashPassword = await bcrypt.hash(password, saltRounds);
    let currentDate = new Date();
    let endDate = new Date();

    /// register new user
    const userResult = await collection.insertOne({
      username,
      email,
      password: hashPassword,
      planId: null,
      startDate: currentDate,
      isWhatsapp: false,
      endDate: endDate,
      isVerified: false,
    });

    const userId = userResult?.insertedId.toString();

    /// set the user details
    await db.collection("user-details").insertOne({
      userId: userId,
      totalMessageCount: 0,
      messageLimit: 0,
      chatbotLimit: 0,
      trainingDataLimit: 0,
      websiteCrawlingLimit: "0",
      conversationHistory: "",
      leads: "",
      models: "",
    });
    msg = "Please check your email to verify your account.";

    // send the registration mail
    await temailService.send(
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
  }

  //send the registration verification  email
  const jwtToken = generateJWTToken(email);
  const link = `${process.env.NEXT_PUBLIC_WEBSITE_URL}/account/email-verified?jwt=${jwtToken}`;
  await temailService.send("verify-email-register-template", [logo], email, {
    link: link,
  });

  return { message: msg };
}

register.schema = joi.object({
  username: joi.string().required(),
  password: joi.string().min(6).required(),
  email: joi.string().required(),
});
