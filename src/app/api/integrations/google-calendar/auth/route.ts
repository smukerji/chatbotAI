import { NextRequest, NextResponse } from "next/server";
import { getAuthUrl } from "@/app/_services/googleCalendarService";

/**
 * GET /api/integrations/google-calendar/auth?chatbotId=xxx&userId=yyy
 *
 * Redirects the browser to Google's OAuth consent page.
 */
export async function GET(req: NextRequest) {
  const chatbotId = req.nextUrl.searchParams.get("chatbotId");
  const userId = req.nextUrl.searchParams.get("userId");

  if (!chatbotId || !userId) {
    return NextResponse.json(
      { error: "chatbotId and userId are required" },
      { status: 400 }
    );
  }

  const url = getAuthUrl(chatbotId, userId);
  return NextResponse.redirect(url);
}
