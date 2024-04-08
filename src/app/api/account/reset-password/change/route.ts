import { NextRequest, NextResponse } from "next/server";
import clientPromise from "../../../../../db";
import bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";

export async function POST(request: NextRequest) {
  const body = await request.json();

  try {
    /// extract the password
    const newPassword = body?.newPassword;

    /// extract the token and verify
    const token = body?.token;
    const decodedToken: any = jwt.verify(
      token,
      process.env.NEXT_PUBLIC_JWT_SECRET!
    );

    /// generate the password hash
    const saltRounds = 10;
    const hashPassword = await bcrypt.hash(newPassword, saltRounds);

    const db = (await clientPromise!).db();
    const collection = db.collection("users");

    /// update the password
    await collection.updateOne(
      { email: decodedToken?.email }, // Assuming userId is the identifier for the user
      { $set: { password: hashPassword } }, // Set the new password hash
      { upsert: true } // Upsert option set to true)
    );

    return NextResponse.json({ message: "Password reset successfull" });
  } catch (error: any) {
    if (error?.message === "jwt expired") {
      return NextResponse.json({
        message: "Oops the link you are trying to access seems expired.",
        status: 400,
      });
    } else return NextResponse.json({ message: error?.message, status: 400 });
  }
}
