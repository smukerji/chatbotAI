import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { ObjectId } from "mongodb";
import clientPromise from "@/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state: string = searchParams.get("state") as string;

    // Parse state
    let userInfo;
    try {
      userInfo = JSON.parse(state);
    } catch (err) {
      return new NextResponse(
        `<html><body>
          <script>
            window.opener?.postMessage('google-oauth-error', '*');
            window.close();
          </script>
          <p>Invalid state parameter from Google OAuth.</p>
        </body></html>`,
        { status: 400, headers: { "Content-Type": "text/html" } }
      );
    }

    const { userId, assistantId, tool } = userInfo || {};
    if (!userId || !assistantId) {
      return new NextResponse(
        `<html><body>
          <script>
            window.opener?.postMessage('google-oauth-error', '*');
            window.close();
          </script>
          <p>Invalid Request: User and Assistant must be provided.</p>
        </body></html>`,
        { status: 400, headers: { "Content-Type": "text/html" } }
      );
    }

    let objectUserId: ObjectId;
    try {
      objectUserId = new ObjectId(userId);
    } catch (err) {
      return new NextResponse(
        `<html><body>
          <script>
            window.opener?.postMessage('google-oauth-error', '*');
            window.close();
          </script>
          <p>Invalid UserId format.</p>
        </body></html>`,
        { status: 400, headers: { "Content-Type": "text/html" } }
      );
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID_TORI_VAPI_GOOGLE_CAL,
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET_TORI_VAPI_GOOGLE_CAL,
      process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI_TORI_VAPI_GOOGLE_CAL
    );

    try {
      // Exchange code for tokens
      const { tokens } = await oauth2Client.getToken(code!);
      if (!tokens?.access_token) throw new Error("No access_token received from Google.");
      oauth2Client.setCredentials(tokens);

      // Fetch Google user info
      const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
      const { data: googleUser } = await oauth2.userinfo.get();

      const db = (await clientPromise!).db();

      // Upsert the OAuth consent record and add tool with publish:true
      await db.collection("google-calendar-oauth-consent").updateOne(
        { googleUserId: googleUser.id, assistantId },
        {
          $set: {
            code,
            tokens,
            updatedAt: new Date(),
            google_user_info: googleUser,
          },
          $setOnInsert: {
            userId: objectUserId,
            assistantId,
            createdAt: new Date(),
          },
          $addToSet: {
            tools: { tool, publish: true },
          }
        },
        { upsert: true }
      );

      return new NextResponse(
        `<html><body>
          <script>
            window.opener?.postMessage('google-oauth-success', '*');
            window.close();
          </script>
          <p>Google Calendar connected! You may close this window.</p>
        </body></html>`,
        { status: 200, headers: { "Content-Type": "text/html" } }
      );
    } catch (error) {
      return new NextResponse(
        `<html><body>
          <script>
            window.opener?.postMessage('google-oauth-error', '*');
            window.close();
          </script>
          <p>Authorization Failed.</p>
        </body></html>`,
        { status: 500, headers: { "Content-Type": "text/html" } }
      );
    }
  } catch (error) {
    return new NextResponse(
      `<html><body>
        <script>
          window.opener?.postMessage('google-oauth-error', '*');
          window.close();
        </script>
        <p>Internal server error.</p>
      </body></html>`,
      { status: 500, headers: { "Content-Type": "text/html" } }
    );
  }
}