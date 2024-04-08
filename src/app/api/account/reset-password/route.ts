import { NextRequest } from "next/server";
import { apiHandler } from "../../../_helpers/server/api/api-handler";
import clientPromise from "../../../../db";
import { emailService } from "../../../_services/emailService";
import * as jwt from "jsonwebtoken";

module.exports = apiHandler({
  POST: resetPassword,
});

async function resetPassword(request: NextRequest) {
  /// check if valid user has requested for password reset
  const body = await request.json();

  /// validate the email address provided by the user from the db
  const email = body?.email;
  const db = (await clientPromise!).db();
  const collection = db.collection("users");
  let userRecord = await collection.findOne({ email: email });

  /// if user is found send the reset link and also check if user is not a google or github user
  if (userRecord && !userRecord?.image) {
    const token = jwt.sign(
      { email: email },
      process.env.NEXT_PUBLIC_JWT_SECRET!,
      {
        expiresIn: 60,
      }
    );
    /// send the password reset mail to the user with a unique token generated
    const temailService = emailService();
    await temailService.send("forgot-password", [], email, {
      reset_password_url: `${process.env.NEXTAUTH_URL}/account/reset-password-form?token=${token}`,
    });

    return {
      message: "Please check your email to reset your password",
    };
  } else {
    return {
      status: 404,
      message: "Sorry! Email not applicable for reseting password",
    };
  }
}
