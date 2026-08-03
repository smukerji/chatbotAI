import { google } from "googleapis";
import clientPromise from "@/db";

const SCOPES = ["https://www.googleapis.com/auth/calendar"];

/** Build an OAuth2 client pre-loaded with tokens for the given chatbot. */
export async function getCalendarClient(chatbotId: string) {
  const db = (await clientPromise!).db();
  const tokenDoc = await db
    .collection("google-calendar-tokens")
    .findOne({ chatbotId });

  if (!tokenDoc) {
    throw new Error(
      `No Google Calendar connected for chatbot ${chatbotId}. Please connect Google Calendar first.`
    );
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    access_token: tokenDoc.accessToken,
    refresh_token: tokenDoc.refreshToken,
    expiry_date: tokenDoc.expiryDate,
  });

  // Auto-refresh the access token and persist back to DB
  oauth2Client.on("tokens", async (tokens) => {
    const update: any = {};
    if (tokens.access_token) update.accessToken = tokens.access_token;
    if (tokens.expiry_date) update.expiryDate = tokens.expiry_date;
    if (tokens.refresh_token) update.refreshToken = tokens.refresh_token;
    await db
      .collection("google-calendar-tokens")
      .updateOne({ chatbotId }, { $set: update });
  });

  return google.calendar({ version: "v3", auth: oauth2Client });
}

/** Returns the OAuth2 URL to start the Google consent flow. */
export function getAuthUrl(chatbotId: string, userId: string): string {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent", // force refresh_token every time
    scope: SCOPES,
    state: JSON.stringify({ chatbotId, userId }),
  });
}

/** Exchange the auth code and persist tokens for this chatbot. */
export async function exchangeCodeAndSave(
  code: string,
  chatbotId: string,
  userId: string
): Promise<void> {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  const { tokens } = await oauth2Client.getToken(code);

  const db = (await clientPromise!).db();
  await db.collection("google-calendar-tokens").updateOne(
    { chatbotId },
    {
      $set: {
        chatbotId,
        userId,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiryDate: tokens.expiry_date,
        connectedAt: new Date(),
      },
    },
    { upsert: true }
  );
}

/** Convert a local datetime string "YYYY-MM-DDTHH:MM:SS" to a proper RFC3339
 *  string with timezone offset that Google Calendar APIs accept.
 *  If the string already has Z or an offset it is returned unchanged.
 */
function toRFC3339(localIso: string, ianaTimezone: string): string {
  if (!localIso) return localIso;
  if (localIso.endsWith('Z') || localIso.match(/[+-]\d{2}:\d{2}$/)) return localIso;

  // Use Intl to get the UTC offset for this timezone at this moment in time
  const date = new Date(localIso + 'Z'); // parse as UTC to get a Date object
  // Get the UTC offset in minutes for the given timezone
  const tzDate = new Date(
    new Intl.DateTimeFormat('en-US', {
      timeZone: ianaTimezone,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false,
    }).format(date).replace(/(\d+)\/(\d+)\/(\d+),\s*(\d+):(\d+):(\d+)/, '$3-$1-$2T$4:$5:$6Z')
  );

  // Simpler approach: format the local string as a fixed offset using the
  // known offset from the timezone. We derive the offset by comparing UTC
  // representations.
  const utcMs = Date.UTC(
    ...localIso.split('T')[0].split('-').map(Number) as [number, number, number],
    ...localIso.split('T')[1].split(':').map(Number) as [number, number, number],
  );

  const localDate = new Date(utcMs);
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: ianaTimezone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
    timeZoneName: 'shortOffset',
  });

  // Extract the numeric offset (e.g. "GMT+5:30" → "+05:30")
  const parts = formatter.formatToParts(localDate);
  const tzPart = parts.find(p => p.type === 'timeZoneName')?.value ?? 'GMT+0';
  const offsetMatch = tzPart.match(/GMT([+-])(\d+)(?::(\d+))?/);
  if (!offsetMatch) return localIso + 'Z'; // fallback

  const sign     = offsetMatch[1];
  const hours    = String(offsetMatch[2]).padStart(2, '0');
  const mins     = String(offsetMatch[3] ?? '0').padStart(2, '0');
  const offset   = `${sign}${hours}:${mins}`;

  return `${localIso}${offset}`;
}

/** Check if a time slot is free on the connected calendar (returns true if free). */
export async function isSlotAvailable(
  chatbotId: string,
  startLocal: string,
  endLocal: string,
  timezone?: string
): Promise<boolean> {
  const calendar = await getCalendarClient(chatbotId);

  // freebusy requires RFC3339 with Z or offset — bare local strings return 400
  // We need the timezone to convert; fetch from DB if not provided
  let tz = timezone;
  if (!tz) {
    const { default: clientPromise } = await import("@/db");
    const db = (await clientPromise!).db();
    const settings = await db.collection("chatbot-settings").findOne({ chatbotId });
    tz = settings?.bookingTimezone ?? "UTC";
  }

  const resolvedTz: string = tz ?? "UTC";

  const startRFC = toRFC3339(startLocal, resolvedTz);
  const endRFC   = toRFC3339(endLocal,   resolvedTz);

  const response = await calendar.freebusy.query({
    requestBody: {
      timeMin: startRFC,
      timeMax: endRFC,
      items: [{ id: "primary" }],
    },
  });

  const busy = response.data.calendars?.["primary"]?.busy ?? [];
  return busy.length === 0;
}

/** Create a calendar event and return its event ID. */
export async function createCalendarEvent(
  chatbotId: string,
  params: {
    summary: string;
    description: string;
    startIso: string;
    endIso: string;
    timezone: string;
    attendeeEmail: string;
  }
): Promise<string> {
  const calendar = await getCalendarClient(chatbotId);

  const event = await calendar.events.insert({
    calendarId: "primary",
    sendUpdates: "all",
    requestBody: {
      summary: params.summary,
      description: params.description,
      start: { dateTime: params.startIso, timeZone: params.timezone },
      end: { dateTime: params.endIso, timeZone: params.timezone },
      attendees: [{ email: params.attendeeEmail }],
    },
  });

  return event.data.id!;
}

/** Update an existing calendar event. */
export async function updateCalendarEvent(
  chatbotId: string,
  googleEventId: string,
  params: {
    summary?: string;
    description?: string;
    startIso?: string;
    endIso?: string;
    timezone?: string;
  }
): Promise<void> {
  const calendar = await getCalendarClient(chatbotId);

  const patch: any = {};
  if (params.summary) patch.summary = params.summary;
  if (params.description) patch.description = params.description;
  if (params.startIso && params.timezone)
    patch.start = { dateTime: params.startIso, timeZone: params.timezone };
  if (params.endIso && params.timezone)
    patch.end = { dateTime: params.endIso, timeZone: params.timezone };

  await calendar.events.patch({
    calendarId: "primary",
    eventId: googleEventId,
    sendUpdates: "all",
    requestBody: patch,
  });
}

/** Delete a calendar event. */
export async function deleteCalendarEvent(
  chatbotId: string,
  googleEventId: string
): Promise<void> {
  const calendar = await getCalendarClient(chatbotId);
  await calendar.events.delete({
    calendarId: "primary",
    eventId: googleEventId,
    sendUpdates: "all",
  });
}
