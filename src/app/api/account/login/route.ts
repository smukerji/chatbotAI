import joi from "joi";
import { connectDatabase } from "../../../../db";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { apiHandler } from "../../../_helpers/server/api/api-handler";

module.exports = apiHandler({
  POST: login,
});

async function login(request: any) {
  const body = await request.json();
  const { username, password } = body;

  const db = await connectDatabase();
  const collection = db.collection("users");
  /// check if user is valid
  const user: any = await collection.findOne({
    username: username,
  });

  if (user) {
    if (password === user?.password) {
      // create a jwt token that is valid for 7 days
      const token = jwt.sign(
        { sub: user?._id?.toString() },
        process.env.NEXT_PUBLIC_JWT_SECRET!,
        {
          expiresIn: "1h",
        }
      );

      // return jwt token in http only cookie
      cookies().set("authorization", token, { httpOnly: true });

      /// set the userId cookie
      cookies().set("userId", user?._id?.toString());
      //   return { message: "Login successfull..." };
      return user;
    } else {
      throw "Username or password is incorrect";
    }
  } else {
    throw `User doesn't exists`;
  }
}

login.schema = joi.object({
  username: joi.string().required(),
  password: joi.string().required(),
});
