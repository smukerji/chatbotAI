import { NextRequest } from "next/server";
import { apiHandler } from "../../../../../../_helpers/server/api/api-handler";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../auth/[...nextauth]/route";
import joi from "joi";
import clientPromise from "../../../../../../../db";
import { ObjectId } from "mongodb";
import bcrypt from "bcrypt";
import {
  ERROR_PROCESSING_REQUEST,
  NOT_AUTHORIZED_USER,
  PASSWORD_NOT_MATCHED,
} from "../../../../../../_helpers/errorConstants";
import { PASSWORD_CHANGED } from "../../../../../../_helpers/successConstans";

module.exports = apiHandler({
  POST: changeUserPassword,
});

async function changeUserPassword(request: NextRequest) {
  /// get the session and then access the id
  const session: any = await getServerSession(authOptions);
  const userId = request?.headers.get("userId")
    ? request?.headers.get("userId")
    : session?.user?.id;

  const body = await request.json();

  /// check if it is google user or custom user
  const isGoogleUser = body?.isGoogleUser;
  const oldPassword = body?.oldPassword;
  const newPassword = body?.newPassword;

  const db = (await clientPromise!).db();

  /// update the user
  if (isGoogleUser) {
    return { message: NOT_AUTHORIZED_USER, status: 401 };
  } else {
    /// first check if the old password is valid
    const user = await db
      .collection("users")
      .findOne({ _id: new ObjectId(userId) });

    if (user?.password) {
      const isPasswordValid = await bcrypt.compare(oldPassword, user?.password);

      /// if old password is true the change the password
      if (isPasswordValid) {
        /// generate the password hash
        const saltRounds = 10;
        const hashPassword = await bcrypt.hash(newPassword, saltRounds);
        /// update the password
        await db.collection("users").updateOne(
          { _id: new ObjectId(userId) },
          {
            $set: {
              password: hashPassword,
            },
          }
        );

        return { message: PASSWORD_CHANGED };
      } else {
        return { message: PASSWORD_NOT_MATCHED, status: 401 };
      }
    } else {
      return { message: ERROR_PROCESSING_REQUEST, status: 403 };
    }
  }
}

/**
 * defining schema for /api/account/user/details/change/password POST route
 */
changeUserPassword.schema = joi.object({
  isGoogleUser: joi.boolean().required(),
  oldPassword: joi.string().optional(),
  newPassword: joi.string().optional(),
});
