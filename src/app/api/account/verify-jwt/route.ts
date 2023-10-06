import { cookies } from "next/headers";
import { auth } from "../../../_helpers/server/auth";
import { NextResponse } from "next/server";

export async function GET(req: any) {
  try {
    if (!auth.verifyToken()) {
      cookies().delete("authorization");
      cookies().delete("userId");
    }
  } catch (e: any) {
    if (e.message === "jwt expired") {
      console.log("Message", e.message);
      cookies().delete("authorization");
      cookies().delete("userId");
      return NextResponse.json({ message: "jwt expired" });
    }
  }

  return NextResponse.json({ message: "ok" });
}
