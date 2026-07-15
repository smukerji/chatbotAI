import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeAndSave } from "@/app/_services/googleCalendarService";

/**
 * GET /api/integrations/google-calendar/callback?code=xxx&state=yyy
 *
 * Google redirects here after the user grants consent.
 * Exchanges the auth code for tokens and saves them, then
 * redirects back to the chatbot dashboard.
 */
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const stateRaw = req.nextUrl.searchParams.get("state");
  const error = req.nextUrl.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_WEBSITE_URL}chatbot?gcalError=${encodeURIComponent(error)}`
    );
  }

  if (!code || !stateRaw) {
    return NextResponse.json(
      { error: "Missing code or state parameter" },
      { status: 400 }
    );
  }

  let chatbotId: string;
  let userId: string;

  try {
    const state = JSON.parse(stateRaw);
    chatbotId = state.chatbotId;
    userId = state.userId;
  } catch {
    return NextResponse.json({ error: "Invalid state parameter" }, { status: 400 });
  }

  try {
    await exchangeCodeAndSave(code, chatbotId, userId);
  } catch (err: any) {
    console.error("Google Calendar token exchange failed:", err);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_WEBSITE_URL}chatbot?gcalError=token_exchange_failed`
    );
  }

  // Redirect back to chatbot dashboard with a success signal
  const chatbotParam = encodeURIComponent(
    JSON.stringify({ id: chatbotId })
  );
  return NextResponse.redirect(
    `${process.env.NEXT_PUBLIC_WEBSITE_URL}chatbot/dashboard?chatbot=${chatbotParam}&editChatbotSource=integrations&gcalSuccess=1`
  );
}
