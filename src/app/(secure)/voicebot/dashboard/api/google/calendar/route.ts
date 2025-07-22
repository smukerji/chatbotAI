
import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET(req: NextRequest) {


    // Get assistantId from query params
    const { searchParams } = new URL(req.url);
    const assistantId = searchParams.get("assistantId");
    const userId = searchParams.get("userId");


    if (!userId || !assistantId) {
        return NextResponse.json({ error: "Invalid Request, User and Assistant should be varified!" }, { status: 400 });
    }

    const oauth2Client = new google.auth.OAuth2(
        process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID_TORI_VAPI_GOOGLE_CAL,
        process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET_TORI_VAPI_GOOGLE_CAL,
        process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI_TORI_VAPI_GOOGLE_CAL
    );

    const scopes = [
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/calendar.readonly',
    ];

    // Pass both userId and assistantId as state, joined by __ or other separator
    const state = {
        userId:userId,
        assistantId:assistantId
    };

    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        scope: scopes,
        state:JSON.stringify(state)
    });

    return NextResponse.redirect(authUrl, { status: 302 });
}