import { NextRequest } from "next/server";
import { apiHandler } from "../../../../../_helpers/server/api/api-handler";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../auth/[...nextauth]/route";
import joi from "joi";
import clientPromise from "../../../../../../db";
import { ObjectId } from "mongodb";
import { USER_DETAILS_UPDATED } from "../../../../../_helpers/successConstans";

module.exports = apiHandler({
  POST: changeUserDetails,
});

async function changeUserDetails(request: NextRequest) {
  /// get the session and then access the id
  const session: any = await getServerSession(authOptions);
  const userId = request?.headers.get("userId")
    ? request?.headers.get("userId")
    : session?.user?.id;

  const body = await request.json();

  /// check if it is google user or custom user
  const isGoogleUser = body?.isGoogleUser;
  const firstName = body?.firstName;
  const lastName = body?.lastName;
  const fullName = body?.fullName;

  const db = (await clientPromise!).db();

  /// update the user
  if (isGoogleUser) {
    const username: string[] = fullName?.split(" ")!;
    await db.collection("users").updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          name: fullName,
          username: username[0] + `${username?.[1] ? "_" + username?.[1] : ""}`,
        },
      }
    );
  } else {
    await db.collection("users").updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          username: firstName + "_" + lastName,
        },
      }
    );
  }

  return { message: USER_DETAILS_UPDATED };
}

/**
 * defining schema for /api/account/user/details/change POST route
 */
changeUserDetails.schema = joi.object({
  isGoogleUser: joi.boolean().required(),
  firstName: joi.string().optional().allow(""),
  lastName: joi.string().optional().allow(""),
  fullName: joi.string().optional().allow(""),
});
