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
        process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET,
        process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI
    );

    try {
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        // For demo, associate tokens with a user ID.
        const userId = "user123";
        userTokens[userId] = tokens;

        return NextResponse.json({ message: "Authentication successful", tokens });
    } catch (error) {
        console.error("Error exchanging code for tokens", error);
        return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
    }
}
