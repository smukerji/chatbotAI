import { cookies } from "next/headers";
import { auth } from "../../../_helpers/server/auth";
import { NextResponse } from "next/server";
import { JWT_EXPIRED } from "../../../_helpers/errorConstants";

export async function GET(req: any) {
  try {
    if (!auth.verifyToken()) {
      cookies().delete("authorization");
      cookies().delete("userId");
    }
  } catch (e: any) {
    if (e.message === JWT_EXPIRED) {
      console.log("Message", e.message);
      cookies().delete("authorization");
      cookies().delete("userId");
      return NextResponse.json({ message: JWT_EXPIRED });
    }
  }

  return NextResponse.json({ message: "ok" });
}
