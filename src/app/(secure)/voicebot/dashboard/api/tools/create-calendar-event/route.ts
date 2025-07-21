import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { getUserTokens, updateUserTokens } from "../../../services/googleTokenHelpers";

export async function POST(req: NextRequest) {
  try {
    const { assistantId, event } = await req.json();
    if (!assistantId || !event) {
      return NextResponse.json({ error: "Missing assistantId or event data." }, { status: 400 });
    }

    // 1. Get user tokens from DB
    const userTokens = await getUserTokens(assistantId);
    if (!userTokens?.refresh_token) {
      return NextResponse.json({ error: "User is not authenticated." }, { status: 401 });
    }

    // 2. Setup Google OAuth2 Client
    const oAuth2Client = new google.auth.OAuth2(
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID_TORI_VAPI_GOOGLE_CAL,
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET_TORI_VAPI_GOOGLE_CAL,
      process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI_TORI_VAPI_GOOGLE_CAL
    );
    oAuth2Client.setCredentials({
      access_token: userTokens.access_token,
      refresh_token: userTokens.refresh_token,
      expiry_date: userTokens.expiry_date,
    });

    // 3. Refresh token if expired
    if (!userTokens.access_token || userTokens.expiry_date < Date.now()) {
      const { credentials } = await oAuth2Client.refreshAccessToken();
      await updateUserTokens(assistantId, credentials);
      oAuth2Client.setCredentials({
        access_token: credentials.access_token,
        refresh_token: credentials.refresh_token || userTokens.refresh_token,
        expiry_date: credentials.expiry_date,
      });
    }

    // 4. Use Google Calendar API to create an event
    const calendar = google.calendar({ version: "v3", auth: oAuth2Client });
    const insertRes = await calendar.events.insert({
      calendarId: "primary",
      requestBody: event, // event object must contain summary, start, end, etc.
    });

    // 5. Return the created event details
    return NextResponse.json({ ok: true, event: insertRes.data });
  } catch (err: any) {
    console.error("Error in create-calendar-event webhook:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}