import { NextResponse } from "next/server";
import { connectDatabase } from "../../../../db";
import { apiHandler } from "../../../_helpers/server/api/api-handler";
import joi from "joi";
import bcrypt from "bcrypt";

module.exports = apiHandler({
  POST: register,
});

async function register(request: any) {
  const body = await request.json();
  const { username, email, password } = body;
  const db = (await connectDatabase()).db();
  const collection = db.collection("users");
  /// validate if user email already exists
  if (await collection.findOne({ email: email })) {
    throw 'Email "' + email + '" is already in use';
  }

  /// generate the password hash
  const saltRounds = 10;
  const hashPassword = await bcrypt.hash(password, saltRounds);

  /// get the starter plan ID
  const starterPlan = await db.collection("plans").findOne({ name: "starter" });

  /// register new user
  await collection.insertOne({
    username,
    email,
    password: hashPassword,
    planId: starterPlan?._id,
  });

  return { message: "Registered successfully... Please login to continue" };
}

register.schema = joi.object({
  username: joi.string().required(),
  password: joi.string().min(6).required(),
  email: joi.string().required(),
});
