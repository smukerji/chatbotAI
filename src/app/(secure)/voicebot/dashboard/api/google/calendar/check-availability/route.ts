
import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import clientPromise from "../../../../../../../../db";
import * as chrono from "chrono-node";
import { DateTime } from "luxon";

function parseEventDetailsFromTitle(title: string) {
  const timeZone = "Asia/Kolkata";
  const now = DateTime.now().setZone(timeZone);

  // Try to parse with chrono-node; always forwardDate=true
  const results = chrono.parse(title, now.toJSDate(), { forwardDate: true });
  if (results.length === 0) return undefined;

  const result = results[0];

  // Always get the next future occurrence for month/day-only dates
  function nextFutureOccurrence(
    month: number,
    day: number,
    hour: number = 9,
    minute: number = 0
  ): DateTime {
    // Try current year first
    let candidate = DateTime.fromObject(
      { year: now.year, month, day, hour, minute },
      { zone: timeZone }
    );
    if (candidate >= now) return candidate;
    // Otherwise bump to next year
    return candidate.plus({ years: 1 });
  }

  let startDate: DateTime | undefined;
  let endDate: DateTime | undefined;

  if (result.start) {
    const s = result.start;
    const month = s.get('month') ?? now.month;
    const day = s.get('day') ?? now.day;
    const hour = s.isCertain('hour') && typeof s.get('hour') === 'number' ? s.get('hour')! : 9;
    const minute = s.isCertain('minute') && typeof s.get('minute') === 'number' ? s.get('minute')! : 0;

    if (s.isCertain('year')) {
      startDate = DateTime.fromJSDate(s.date()).setZone(timeZone);
    } else if (typeof month === 'number' && typeof day === 'number') {
      startDate = nextFutureOccurrence(month, day, hour, minute);
    } else {
      // Could not parse month/day
      return undefined;
    }
  }

  if (result.end) {
    const e = result.end;
    const month = e.get('month') ?? (startDate ? startDate.month : now.month);
    const day = e.get('day') ?? (startDate ? startDate.day : now.day);
    const hour = e.isCertain('hour') && typeof e.get('hour') === 'number'
      ? e.get('hour')!
      : (startDate ? startDate.hour + 1 : 10);
    const minute = e.isCertain('minute') && typeof e.get('minute') === 'number' ? e.get('minute')! : 0;

    if (e.isCertain('year')) {
      endDate = DateTime.fromJSDate(e.date()).setZone(timeZone);
    } else if (typeof month === 'number' && typeof day === 'number') {
      endDate = nextFutureOccurrence(month, day, hour, minute);
      // If end is before start, bump to next year
      if (startDate && endDate < startDate) endDate = endDate.plus({ years: 1 });
    } else {
      // Could not parse month/day
      return undefined;
    }
  } else if (startDate) {
    // Default duration = 1 hour
    endDate = startDate.plus({ hours: 1 });
  }

  // // Debug chrono-node parsing
  // console.log("chrono-node parsing result:", {
  //   input: title,
  //   startDate: startDate?.toISO(),
  //   endDate: endDate?.toISO(),
  //   isStartYearCertain: result.start?.isCertain('year'),
  //   isEndYearCertain: result.end?.isCertain('year'),
  // });

  return {
    summary: title,
    startDateTime: startDate?.toISO(),
    endDateTime: endDate?.toISO(),
    timeZone,
  };
}

// Utility: Always treat the clock time as IST, ignoring the input offset
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

function getDayBounds(dateISO: string): { timeMin: string; timeMax: string } {
  const date = DateTime.fromISO(dateISO, { zone: "Asia/Kolkata" }).startOf("day");
  const startOfDay = date.plus({ hours: 8 }).toISO();
  const endOfDay = date.plus({ hours: 17 }).toISO();
  if (!startOfDay || !endOfDay) throw new Error("Invalid dateISO");
  return {
    timeMin: startOfDay,
    timeMax: endOfDay,
  };
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


function suggestAvailableSlots(
  busySlots: { start: string; end: string }[],
  requestedStart: string,
  requestedEnd: string
): { start: string; end: string }[] {
  const WORK_START = 8;
  const WORK_END = 17;
  const SLOT_DURATION = 1; // hour
  const requested = DateTime.fromISO(requestedStart, { zone: "Asia/Kolkata" });
  const date = requested.startOf("day");

  let slots: { start: string; end: string }[] = [];
  for (let hour = WORK_START; hour <= WORK_END - SLOT_DURATION; hour++) {
    let slotStart = date.plus({ hours: hour });
    let slotEnd = slotStart.plus({ hours: SLOT_DURATION });
    // Don't suggest the originally requested slot
    if (slotStart.toISO() === requestedStart && slotEnd.toISO() === requestedEnd) continue;

    // Check for overlap with all busy slots
    let overlaps = busySlots.some(b => {
      let bStart = DateTime.fromISO(b.start, { zone: "Asia/Kolkata" });
      let bEnd = DateTime.fromISO(b.end, { zone: "Asia/Kolkata" });
      // Overlap if slotStart < bEnd && slotEnd > bStart
      return slotStart < bEnd && slotEnd > bStart;
    });
    if (!overlaps) {
      slots.push({ start: slotStart.toISO()!, end: slotEnd.toISO()! });
    }
  }
  return slots.slice(0, 2);
}

async function checkAvailability(
  oauth2Client: any,
  startDateTime: string,
  endDateTime: string,
  timeZone = "Asia/Kolkata"
) {
  console.log("Calling freeBusy for:", startDateTime, "to", endDateTime, "in", timeZone);
  const calendar = google.calendar({ version: "v3", auth: oauth2Client });
  const freeBusyRes = await calendar.freebusy.query({
    requestBody: {
      timeMin: startDateTime,
      timeMax: endDateTime,
      timeZone,
      items: [{ id: "primary" }]
    }
  });
  const busy = freeBusyRes.data?.calendars?.["primary"]?.busy ?? [];
  
  return { isFree: busy.length === 0, freeBusyRes: freeBusyRes.data, busySlots: busy };
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

    // Extract title and toolCallId from Vapi payload
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

    // Prefer explicit date/time arguments if present
    let startDateTime =
      body?.message?.toolCalls?.[0]?.function?.arguments?.startTime ||
      undefined;

    let endDateTime =
      body?.message?.toolCalls?.[0]?.function?.arguments?.endTime ||
      undefined;

    // Bump all incoming date strings to the future if needed and force IST clock time (ignoring offset)
    startDateTime = bumpDateToFutureIST(startDateTime);
    endDateTime = bumpDateToFutureIST(endDateTime);

    let summary = title;
    const timeZone = "Asia/Kolkata";

    
    if (!title || !toolCallId || !assistantId) {
      const responseBody = {
        results: [
          {
            toolCallId,
            result: "Error: Missing required fields (title, toolCallId, assistantId)"
          }
        ]
      };
     
      return NextResponse.json(responseBody, { status: 200 });
    }

    // If explicit date/time not present, try parsing from title using chrono-node
    if (!startDateTime || !endDateTime) {
      const parsed = parseEventDetailsFromTitle(title);
      
      if (!parsed || !parsed.startDateTime || !parsed.endDateTime) {
        const responseBody = {
          results: [
            {
              toolCallId,
              result: "Error: Could not parse date/time from the event title. Please provide more details."
            }
          ]
        };
       
        return NextResponse.json(responseBody, { status: 200 });
      }
      summary = parsed.summary;
      startDateTime = parsed.startDateTime;
      endDateTime = parsed.endDateTime;
      // timeZone already set
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

      return NextResponse.json(responseBody, { status: 200 });
    }

    // Setup OAuth client & ensure valid token
    let tokens = consent.tokens;
    const oauth2Client = getOAuthClient(tokens);
    tokens = await refreshTokensIfNeeded(oauth2Client, tokens, assistantId);

    

    // Check availability of requested slot
const { isFree, busySlots } = await checkAvailability(
  oauth2Client,
  startDateTime!,
  endDateTime!,
  timeZone
);

let suggestedSlots: { start: string; end: string }[] = [];

if (!isFree) {
  // NEW: Query busy slots for full working day
  const { timeMin, timeMax } = getDayBounds(startDateTime!);

  const dailyBusyRef = await checkAvailability(
    oauth2Client,
    timeMin,
    timeMax,
    timeZone
  );
  const dailyBusySlots = dailyBusyRef.busySlots;

  suggestedSlots = suggestAvailableSlots(
    dailyBusySlots.map(slot => ({
      start: slot.start ?? "",
      end: slot.end ?? ""
    })),
    startDateTime!,
    endDateTime!
  );
}

    // Format suggested slots as text
    let suggestedSlotsString = "";
    if (suggestedSlots.length > 0) {
      suggestedSlotsString = suggestedSlots
        .map(slot => {
          const start = DateTime.fromISO(slot.start, { zone: "Asia/Kolkata" });
          const end = DateTime.fromISO(slot.end, { zone: "Asia/Kolkata" });
          return `${start.toFormat("h a")} to ${end.toFormat("h a")}`;
        })
        .join(" or ");
    }

    // TEST MESSAGE: this will be very obvious to LLM/assistant if it reaches the result!
    const obviousTestString =
      "********** TEST: THIS IS A BUSY SLOT! IF YOU SEE THIS MESSAGE, THE TOOL RESULT IS VISIBLE TO THE ASSISTANT. **********";

    let resultString = "";
    if (!isFree) {
      resultString = `${obviousTestString} Here are two available time slots: ${suggestedSlotsString}`;
    } else {
      resultString =
        "No event has been created. This response shows the result of the busyRef (freeBusy) API check only.";
    }

    // Respond with the required sync tool format: result must be a single-line string
    const responseBody = {
      results: [
        {
          toolCallId,
          result: resultString
        }
      ]
    };

    return NextResponse.json(responseBody, { status: 200 });

  } catch (err: any) {
    const responseBody = {
      results: [
        {
          toolCallId,
          result: "Error: Server error while checking busyRef. " + err.toString()
        }
      ]
    };

    return NextResponse.json(responseBody, { status: 200 });
  }
}
