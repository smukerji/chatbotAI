import { NextRequest } from "next/server";
import { auth } from "../auth";

export { jwtMiddleware };
async function jwtMiddleware(req: NextRequest) {
  if (isPublicPath(req)) return;

  // verify token in request cookie
  const id = auth.verifyToken();
  req.headers.set("userId", id);
}

export function isPublicPath(req: NextRequest) {
  // public routes that don't require authentication
  const publicPaths = [
    "POST:/api/account/login",
    "POST:/api/account/logout",
    "POST:/api/account/register",
    "POST:/api/account/reset-password",
    "POST:/chatbot/api/lead",
    "GET:/api/account/user/details",
    "GET:/chatbot/dashboard/api",
    "GET:/blog/api/singleblog",
    "GET:/blog/api/allblogs",
    "GET:/blog/api/allslugs",
    "GET:/blog/api/previewblog",
    "GET:/voicebot/dashboard/api/template",
    "GET:/voicebot/dashboard/api/assistant",
    "DELETE:/voicebot/dashboard/api/assistant",
    "POST:/blog/api/previewblog",
    "POST:/home/pricing/stripe-payment-gateway/get-plan-prices",
    "POST:/voicebot/dashboard/api/assistant",
  ];

  return publicPaths.includes(`${req.method}:${req.nextUrl.pathname}`);
}
