// import { NextRequest, NextResponse } from "next/server";
// import { google } from "googleapis";
// /**
//  * 
//  * @param req        
//  *  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID_TORI_VAPI_GOOGLE_CAL,
//  * process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET_TORI_VAPI_GOOGLE_CAL,
//  * process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI_TORI_VAPI_GOOGLE_CAL
//  * @returns 
//  */
// export async function GET(req: NextRequest) {
//     console.log({clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID_TORI_VAPI_GOOGLE_CAL,
//         clientSecret: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET_TORI_VAPI_GOOGLE_CAL,
//         redirectUri: process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI_TORI_VAPI_GOOGLE_CAL,
//         apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY
//     });
    
//     const oauth2Client = new google.auth.OAuth2(
//         process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID_TORI_VAPI_GOOGLE_CAL,
//         process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET_TORI_VAPI_GOOGLE_CAL,
//         process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI_TORI_VAPI_GOOGLE_CAL
//     );

//     const scopes = [
//         'https://www.googleapis.com/auth/calendar.events',
//         'https://www.googleapis.com/auth/calendar.readonly',
//     ];

//     const authUrl = oauth2Client.generateAuthUrl({
//         access_type: 'offline',
//         prompt: 'consent',
//         scope: scopes,
        
//     });

//     // Redirect to Google OAuth URL
//     return NextResponse.redirect(authUrl, { status: 302 });
// }



//working code for userid
// import { NextRequest, NextResponse } from "next/server";
// import { google } from "googleapis";
// import { cookies } from "next/headers";

// export async function GET(req: NextRequest) {
//     // Get userId from cookie
//     const cookieStore = cookies();
//     const userId = cookieStore.get("userId")?.value;

//     if (!userId) {
//         return NextResponse.json({ error: "Missing userId cookie" }, { status: 400 });
//     }

//     const oauth2Client = new google.auth.OAuth2(
//         process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID_TORI_VAPI_GOOGLE_CAL,
//         process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET_TORI_VAPI_GOOGLE_CAL,
//         process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI_TORI_VAPI_GOOGLE_CAL
//     );

//     const scopes = [
//         'https://www.googleapis.com/auth/calendar.events',
//         'https://www.googleapis.com/auth/calendar.readonly',
//     ];

//     // Pass userId as state!
//     const authUrl = oauth2Client.generateAuthUrl({
//         access_type: 'offline',
//         prompt: 'consent',
//         scope: scopes,
//         state: userId, 
//     });

//     return NextResponse.redirect(authUrl, { status: 302 });
// }




import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
    // Get userId from cookie
    const cookieStore = cookies();
    const userId = cookieStore.get("userId")?.value;

    // Get assistantId from query params
    const { searchParams } = new URL(req.url);
    const assistantId = searchParams.get("Id");


    if (!userId || !assistantId) {
        return NextResponse.json({ error: "Missing userId cookie or assistantId param" }, { status: 400 });
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
    const state = `${userId}__${assistantId}`;

    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        scope: scopes,
        state, 
    });

    return NextResponse.redirect(authUrl, { status: 302 });
}