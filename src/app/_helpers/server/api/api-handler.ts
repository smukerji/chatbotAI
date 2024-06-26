import { NextRequest, NextResponse } from "next/server";
import errorHandler from "./error-handler";
import { isPublicPath, jwtMiddleware } from "./jwt-middlerware";
import { validateMiddleware } from "./validate-middleware";
import { getSession } from "next-auth/react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../api/auth/[...nextauth]/route";

function apiHandler(handler: any) {
  const wrappedHandler: any = {};
  const httpMethods = ["GET", "POST", "PUT", "PATCH", "DELETE"];

  /// wrapping handler methods to add middleware and global error handler
  httpMethods.forEach((method) => {
    if (typeof handler[method] !== "function") return;

    wrappedHandler[method] = async (req: NextRequest, ...args: any) => {
      try {
        /// monkey patch req.json() because it can only be called once
        const json = await req.json();
        req.json = () => json;
      } catch {}

      try {
        /// check if it is custom system user
        const customUser = req.headers.get("cookie")?.includes("authorization");

        if (customUser) {
          /// global middleware
          await jwtMiddleware(req);
          await validateMiddleware(req, handler[method].schema);
        } else {
          /// first check if it is public like login, logout request the bypass it
          if (isPublicPath(req)) {
            await validateMiddleware(req, handler[method].schema);
          } else {
            const session = await getServerSession(authOptions);
            // console.log(session);

            /// if there is no session the throw message
            if (!session) throw new Error("Please login to continue");
            await validateMiddleware(req, handler[method].schema);
          }
        }

        /// route handler
        const responseBody = await handler[method](req, ...args);
        return NextResponse.json(responseBody || {}, {
          status: responseBody?.status
            ? typeof responseBody?.status === "number"
              ? responseBody?.status
              : 200
            : 200,
        });
      } catch (err: any) {
        /// global error handler
        return errorHandler(err);
      }
    };
  });

  return wrappedHandler;
}

export { apiHandler };
