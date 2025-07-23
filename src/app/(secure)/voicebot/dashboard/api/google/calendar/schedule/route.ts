// import { NextRequest, NextResponse } from "next/server";
// import { google } from "googleapis";
// import clientPromise from "@/db";


// export async function POST(req: NextRequest) {
//   try {
//     const body = await req.json();
//     // Expecting: userId, assistantId, title, startTime, endTime, participants, description
//     const { userId, assistantId, title, startTime, endTime, participants, description } = body;

//     if (!userId || !assistantId || !title || !startTime || !endTime) {
//       return NextResponse.json({
//         success: false,
//         message: "Missing required fields.",
//         errorCode: "MISSING_FIELDS"
//       }, { status: 400 });
//     }

//     // Connect to DB and find tokens
//     const db = (await clientPromise!).db();
//     const oauthDoc = await db.collection("google-calendar-oauth-consent").findOne({
//       userId: typeof userId === "string" ? { $eq: userId } : userId,
//       assistantId: assistantId
//     });

//     if (!oauthDoc || !oauthDoc.tokens) {
//       return NextResponse.json({
//         success: false,
//         message: "Google Calendar is not connected for this user/assistant.",
//         errorCode: "NO_OAUTH"
//       }, { status: 401 });
//     }

//     // Set up OAuth2 client
//     const oauth2Client = new google.auth.OAuth2(
//       process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID_TORI_VAPI_GOOGLE_CAL,
//       process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET_TORI_VAPI_GOOGLE_CAL,
//       process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI_TORI_VAPI_GOOGLE_CAL
//     );
//     oauth2Client.setCredentials(oauthDoc.tokens);

//     // Prepare event
//     const event = {
//       summary: title,
//       description: description || "",
//       start: {
//         dateTime: new Date(startTime).toISOString(),
//         timeZone: "UTC"
//       },
//       end: {
//         dateTime: new Date(endTime).toISOString(),
//         timeZone: "UTC"
//       },
//       attendees: Array.isArray(participants)
//         ? participants.map(email => ({ email }))
//         : [],
//     };

//     // Insert event
//     const calendar = google.calendar({ version: "v3", auth: oauth2Client });
//     let gEvent;
//     try {
//       gEvent = await calendar.events.insert({
//         calendarId: "primary",
//         requestBody: event,
//         sendUpdates: "all", // Sends invites to attendees
//       });
//     } catch (err: any) {
//       // Token refresh logic or error reporting
//       return NextResponse.json({
//         success: false,
//         message: "Failed to create event in Google Calendar.",
//         errorCode: "GOOGLE_API_ERROR",
//         details: err.toString()
//       }, { status: 500 });
//     }

//     return NextResponse.json({
//       success: true,
//       message: `Your meeting "${title}" has been scheduled.`,
//       scheduledFor: startTime,
//       calendarEventId: gEvent.data.id,
     
//     }, { status: 200 });

//   } catch (err: any) {
//     return NextResponse.json({
//       success: false,
//       message: "Server error while scheduling meeting.",
//       errorCode: "SERVER_ERROR",
//       details: err.toString()
//     }, { status: 500 });
//   }
// }








import { NextRequest, NextResponse } from "next/server";
// import { google } from "googleapis"; 


export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Expecting: userId, assistantId, title, startTime, endTime, participants, description
    const { userId, assistantId, title, startTime, endTime, participants, description } = body;

    if (!userId || !assistantId || !title || !startTime || !endTime) {
      return NextResponse.json({
        success: false,
        message: "Missing required fields.",
        errorCode: "MISSING_FIELDS"
      }, { status: 400 });
    }

    // --- MOCK: Just simulate DB lookup and always "success" for test ---
    // Optionally log payload for debug
    console.log("Received scheduling payload:", {
      userId,
      assistantId,
      title,
      startTime,
      endTime,
      participants,
      description,
    });

    // You can add a fake event ID for reference
    const fakeEventId = "test-event-" + Date.now();

    return NextResponse.json({
      success: true,
      message: `Your meeting "${title}" has been scheduled (test mode).`,
      scheduledFor: startTime,
      endTime,
      calendarEventId: fakeEventId,
      participants,
      description,
      test: true
    }, { status: 200 });

  } catch (err: any) {
    return NextResponse.json({
      success: false,
      message: "Server error while scheduling meeting.",
      errorCode: "SERVER_ERROR",
      details: err.toString()
    }, { status: 500 });
  }
}