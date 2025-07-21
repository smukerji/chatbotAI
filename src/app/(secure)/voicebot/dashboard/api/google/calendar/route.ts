import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
/**
 * 
 * @param req        
 *  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID_TORI_VAPI_GOOGLE_CAL,
 * process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET_TORI_VAPI_GOOGLE_CAL,
 * process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI_TORI_VAPI_GOOGLE_CAL
 * @returns 
 */
export async function GET(req: NextRequest) {
    console.log({clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID_TORI_VAPI_GOOGLE_CAL,
        clientSecret: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET_TORI_VAPI_GOOGLE_CAL,
        redirectUri: process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI_TORI_VAPI_GOOGLE_CAL,
        apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY
    });
    
    const oauth2Client = new google.auth.OAuth2(
        process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID_TORI_VAPI_GOOGLE_CAL,
        process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET_TORI_VAPI_GOOGLE_CAL,
        process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI_TORI_VAPI_GOOGLE_CAL
    );

    const scopes = [
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/calendar.readonly',
    ];

    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        scope: scopes,
    });

    // Redirect to Google OAuth URL
    return NextResponse.redirect(authUrl, { status: 302 });
}


