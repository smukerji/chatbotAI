
import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import clientPromise from "../../../../../../../../db";

// Utility: Always treat the clock time as IST, ignoring the input offset
import { DateTime } from "luxon";
function bumpDateToFutureIST(dateString: string | undefined): string | undefined {
  if (!dateString) return undefined;
  // Parse as "naive" local time, ignoring any offset, and force IST
  const naive = DateTime.fromISO(dateString, { setZone: true }).toFormat("yyyy-MM-dd'T'HH:mm:ss");
  let date = DateTime.fromFormat(naive, "yyyy-MM-dd'T'HH:mm:ss", { zone: "Asia/Kolkata" });
  const now = DateTime.now().setZone("Asia/Kolkata");
  while (date < now) {
    date = date.plus({ years: 1 });
  }
  return date.toISO() ?? undefined;
}

async function getConsentByAssistantId(assistantId: string) {
  const db = (await clientPromise!).db();
  return db.collection("google-calendar-oauth-consent").findOne({ assistantId });
}

function getOAuthClient(tokens: any) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID_TORI_VAPI_GOOGLE_CAL,
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET_TORI_VAPI_GOOGLE_CAL,
    process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI_TORI_VAPI_GOOGLE_CAL
  );
  oauth2Client.setCredentials(tokens);
  return oauth2Client;
}

async function refreshTokensIfNeeded(oauth2Client: any, tokens: any, assistantId: string) {
  const now = Date.now();
  if (!tokens.expiry_date || now > tokens.expiry_date) {
    const { credentials } = await oauth2Client.refreshAccessToken();
    oauth2Client.setCredentials(credentials);
    const db = (await clientPromise!).db();
    await db.collection("google-calendar-oauth-consent").updateOne(
      { assistantId },
      {
        $set: {
          "tokens.access_token": credentials.access_token,
          "tokens.expiry_date": credentials.expiry_date,
        },
      }
    );
    return credentials;
  }
  return tokens;
}

export async function POST(req: NextRequest) {
  let toolCallId = "toolCallId";
  try {
    const body = await req.json();

    // Extract all possible assistantId fields for debugging
    const assistantId1 = body?.message?.assistantId;
    const assistantId2 = body?.message?.assistant?.id;
    const assistantId3 = body?.call?.assistantId;

    // Robust extraction for assistantId
    const assistantId =
      assistantId2 ||
      assistantId3 ||
      assistantId1 ||
      undefined;

    // Extract params
    const title =
      body?.parameters?.title ||
      body?.message?.toolCalls?.[0]?.function?.arguments?.title ||
      body?.message?.toolCallList?.[0]?.function?.arguments?.title ||
      undefined;

    toolCallId =
      body?.message?.toolCalls?.[0]?.id ||
      body?.toolCallId ||
      body?.message?.toolCallList?.[0]?.id ||
      "toolCallId";

    let startDateTime =
      body?.parameters?.startTime ||
      body?.message?.toolCalls?.[0]?.function?.arguments?.startTime ||
      body?.message?.toolCallList?.[0]?.function?.arguments?.startTime ||
      undefined;

    let endDateTime =
      body?.parameters?.endTime ||
      body?.message?.toolCalls?.[0]?.function?.arguments?.endTime ||
      body?.message?.toolCallList?.[0]?.function?.arguments?.endTime ||
      undefined;

    const description =
      body?.parameters?.description ||
      body?.message?.toolCalls?.[0]?.function?.arguments?.description ||
      body?.message?.toolCallList?.[0]?.function?.arguments?.description ||
      "";

    // Bump all incoming date strings to the future if needed and force IST clock time (ignoring offset)
    startDateTime = bumpDateToFutureIST(startDateTime);
    endDateTime = bumpDateToFutureIST(endDateTime);

    const timeZone = "Asia/Kolkata";

    // Log for debugging
    console.log("Final extracted values - title:", title);
    console.log("Final extracted values - toolCallId:", toolCallId);
    console.log("Final extracted values - assistantId:", assistantId);
    console.log("Final extracted values - startDateTime:", startDateTime);
    console.log("Final extracted values - endDateTime:", endDateTime);

    if (!title || !toolCallId || !assistantId || !startDateTime || !endDateTime) {
      const responseBody = {
        results: [
          {
            toolCallId,
            result: "Error: Missing required fields (title, startTime, endTime, toolCallId, assistantId)"
          }
        ]
      };
      console.log("RESPONSE SENT:", JSON.stringify(responseBody, null, 2));
      return NextResponse.json(responseBody, { status: 200 });
    }

    // Get tokens from DB
    const consent = await getConsentByAssistantId(assistantId);
    if (!consent || !consent.tokens) {
      const responseBody = {
        results: [
          {
            toolCallId,
            result: "Error: No Google OAuth tokens found for assistantId"
          }
        ]
      };
      console.log("RESPONSE SENT:", JSON.stringify(responseBody, null, 2));
      return NextResponse.json(responseBody, { status: 200 });
    }

    // Setup OAuth client & ensure valid token
    let tokens = consent.tokens;
    const oauth2Client = getOAuthClient(tokens);
    tokens = await refreshTokensIfNeeded(oauth2Client, tokens, assistantId);

    // Create event
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    const event = {
      summary: title,
      description,
      start: {
        dateTime: startDateTime,
        timeZone,
      },
      end: {
        dateTime: endDateTime,
        timeZone,
      },
    };

    let createdEvent;
    try {
      createdEvent = await calendar.events.insert({
        calendarId: "primary",
        requestBody: event,
      });
    } catch (err: any) {
      const responseBody = {
        results: [
          {
            toolCallId,
            result: "Error: Failed to create event: " + err.message
          }
        ]
      };
      console.log("RESPONSE SENT:", JSON.stringify(responseBody, null, 2));
      return NextResponse.json(responseBody, { status: 200 });
    }

    // Event created successfully
    const created = createdEvent?.data;
    const resultString = `Event created: "${title}" from ${DateTime.fromISO(startDateTime, { zone: "Asia/Kolkata" }).toFormat("fff")} to ${DateTime.fromISO(endDateTime, { zone: "Asia/Kolkata" }).toFormat("fff")}.`;

    const responseBody = {
      results: [
        {
          toolCallId,
          result: resultString
        }
      ]
    };
    console.log("RESPONSE SENT:", JSON.stringify(responseBody, null, 2));
    return NextResponse.json(responseBody, { status: 200 });
  } catch (err: any) {
    const responseBody = {
      results: [
        {
          toolCallId,
          result: "Error: Server error while creating event. " + err.toString()
        }
      ]
    };
    console.log("RESPONSE SENT:", JSON.stringify(responseBody, null, 2));
    return NextResponse.json(responseBody, { status: 200 });
  }
}