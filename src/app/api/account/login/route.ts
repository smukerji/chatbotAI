import joi from "joi";
import { connectDatabase } from "../../../../db";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { apiHandler } from "../../../_helpers/server/api/api-handler";
import bcrypt from "bcrypt";

module.exports = apiHandler({
  POST: login,
});

async function login(request: any) {
  const body = await request.json();
  const { username, password } = body;

  const db = (await connectDatabase()).db();
  const collection = db.collection("users");
  /// check if user is valid
  const user: any = await collection.findOne({
    email: username,
  });

  if (user) {
    const isPasswordValid = await bcrypt.compare(password, user?.password);

    if (isPasswordValid) {
      // create a jwt token that is valid for 7 days
      const token = jwt.sign(
        { sub: user?._id?.toString() },
        process.env.NEXT_PUBLIC_JWT_SECRET!,
        {
          expiresIn: "7d",
        }
      );

      // return jwt token in http only cookie
      cookies().set("authorization", token, { httpOnly: true });

      /// set the userId cookie
      cookies().set("userId", user?._id?.toString());

      /// set the username
      cookies().set("username", user?.username?.toString());

      return { message: "Login successfull...", username: user?.username };
    } else {
      throw "Invalid email or password.";
    }
  } else {
    throw `User doesn’t exist!`;
  }
}

login.schema = joi.object({
  username: joi.string().required(),
  password: joi.string().required(),
});
