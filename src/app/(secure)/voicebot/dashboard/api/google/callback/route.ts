import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

// In-memory store for demo purposes
const userTokens: Record<string, any> = {};

export async function GET(req: NextRequest) { //
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    console.log("Code received from Google:", code);

    if (!code) {
        return NextResponse.json({ error: "Missing code parameter" }, { status: 400 });
    }

    const oauth2Client = new google.auth.OAuth2(
        process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID_TORI_VAPI_GOOGLE_CAL,
        process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET_TORI_VAPI_GOOGLE_CAL,
        process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI_TORI_VAPI_GOOGLE_CAL
    );

    try {
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        // For demo, associate tokens with a user ID.
        const userId = "user123";
        userTokens[userId] = tokens;
        console.log("your User token ", userTokens);

        return NextResponse.json({ message: "Authentication successful", tokens });
    } catch (error) {
        console.error("Error exchanging code for tokens", error);
        return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
    }
}
