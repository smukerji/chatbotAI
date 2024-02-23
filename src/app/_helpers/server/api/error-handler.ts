import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import React from "react";

function errorHandler(err: any) {
  console.log(err.name);

  if (typeof err === "string") {
    // custom application error
    const is404 = err.toLowerCase().endsWith("not found");
    const status = is404 ? 404 : 400;
    return NextResponse.json({ message: err }, { status });
  }

  if (err.name === "JsonWebTokenError") {
    /// jwt error - delete cookie to auto logout
    cookies().delete("authorization");
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (err.name === "TokenExpiredError") {
    /// jwt error - delete cookie to auto logout
    cookies().delete("authorization");
    cookies().delete("username");
    cookies().delete("userId");
  }

  // default to 500 server error
  return NextResponse.json({ message: err.message }, { status: 500 });
}

export default errorHandler;
