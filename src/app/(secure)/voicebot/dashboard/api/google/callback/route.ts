// // import { NextRequest, NextResponse } from "next/server";
// // import { google } from "googleapis";

// // // In-memory store for demo purposes
// // const userTokens: Record<string, any> = {};

// // export async function GET(req: NextRequest) { //
// //     const { searchParams } = new URL(req.url);
// //     const code = searchParams.get("code");
// //     const state = searchParams.get("state");
// //     console.log("Code received from Google:", code);
// //     console.log("State received from Google:", state);

// //     if (!code) {
// //         return NextResponse.json({ error: "Missing code parameter" }, { status: 400 });
// //     }




// //     const oauth2Client = new google.auth.OAuth2(
// //         process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID_TORI_VAPI_GOOGLE_CAL,
// //         process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET_TORI_VAPI_GOOGLE_CAL,
// //         process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI_TORI_VAPI_GOOGLE_CAL
// //     );

// //     try {
// //         const { tokens } = await oauth2Client.getToken(code);
// //         oauth2Client.setCredentials(tokens);

// //         // For demo, associate tokens with a user ID.
// //         const userId = "user123";
// //         userTokens[userId] = tokens;
// //         console.log("your User token ", userTokens);
// //         console.log(userId);


        

// //         return NextResponse.json({ message: "Authentication successful", tokens });
// //     } catch (error) {
// //         console.error("Error exchanging code for tokens", error);
// //         return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
// //     }
// // }




// import { NextRequest, NextResponse } from "next/server";
// import { google } from "googleapis";
// import { ObjectId } from "mongodb";
// import typedClientPromise from "@/db";

// export async function GET(req: NextRequest) {
//     const { searchParams } = new URL(req.url);
//     const code = searchParams.get("code");
//     const userIdStr = searchParams.get("state");

//     if (!code || !userIdStr) {
//         return NextResponse.json({ error: "Missing code or userId parameter" }, { status: 400 });
//     }

//     // Convert userId to ObjectId
//     let userId: ObjectId;
//     try {
//         userId = new ObjectId(userIdStr);
//     } catch (e) {
//         return NextResponse.json({ error: "Invalid userId" }, { status: 400 });
//     }

//     const oauth2Client = new google.auth.OAuth2(
//         process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID_TORI_VAPI_GOOGLE_CAL,
//         process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET_TORI_VAPI_GOOGLE_CAL,
//         process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI_TORI_VAPI_GOOGLE_CAL
//     );

//     try {
//         const { tokens } = await oauth2Client.getToken(code);
//         oauth2Client.setCredentials(tokens);

//         const client = await typedClientPromise;
//         const db = client.db();

//         await db.collection("google-calendar-oauth-consent").updateOne(
//             { userId }, // filter by ObjectId
//             {
//                 $set: {
//                     code,
//                     tokens,
//                     updatedAt: new Date(),
//                 },
//                 $setOnInsert: {
//                     userId, 
//                     createdAt: new Date(),
//                 },
//             },
//             { upsert: true }
//         );

//         return NextResponse.json({ message: "Authentication successful", tokens });
//     } catch (error) {
//         console.error("Error exchanging code for tokens", error);
//         return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
//     }
// }




//working code with user-id
// import { NextRequest, NextResponse } from "next/server";
// import { google } from "googleapis";
// import { ObjectId } from "mongodb";
// import typedClientPromise from "@/db";

// export async function GET(req: NextRequest) {
//     const { searchParams } = new URL(req.url);
//     const code = searchParams.get("code");
//     const userIdStr = searchParams.get("state");

//     if (!code || !userIdStr) {
//         return new NextResponse(`
//             <html><body>
//                 <script>
//                     window.opener?.postMessage('google-oauth-error', '*');
//                     window.close();
//                 </script>
//                 <p>Missing code or userId parameter.</p>
//             </body></html>
//         `, {
//             status: 400,
//             headers: { "Content-Type": "text/html" }
//         });
//     }

//     // Convert userId to ObjectId
//     let userId: ObjectId;
//     try {
//         userId = new ObjectId(userIdStr);
//     } catch (e) {
//         return new NextResponse(`
//             <html><body>
//                 <script>
//                     window.opener?.postMessage('google-oauth-error', '*');
//                     window.close();
//                 </script>
//                 <p>Invalid userId parameter.</p>
//             </body></html>
//         `, {
//             status: 400,
//             headers: { "Content-Type": "text/html" }
//         });
//     }

//     const oauth2Client = new google.auth.OAuth2(
//         process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID_TORI_VAPI_GOOGLE_CAL,
//         process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET_TORI_VAPI_GOOGLE_CAL,
//         process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI_TORI_VAPI_GOOGLE_CAL
//     );

//     try {
//         const { tokens } = await oauth2Client.getToken(code);
//         oauth2Client.setCredentials(tokens);

//         const client = await typedClientPromise;
//         const db = client.db();

//         await db.collection("google-calendar-oauth-consent").updateOne(
//             { userId }, // filter by ObjectId
//             {
//                 $set: {
//                     code,
//                     tokens,
//                     updatedAt: new Date(),
//                 },
//                 $setOnInsert: {
//                     userId,
//                     createdAt: new Date(),
//                 },
//             },
//             { upsert: true }
//         );

//         // Return an HTML page that notifies the opener and closes the popup
//         return new NextResponse(`
//             <html><body>
//                 <script>
//                     window.opener?.postMessage('google-oauth-success', '*');
//                     window.close();
//                 </script>
//                 <p>Google Calendar connected! You may close this window.</p>
//             </body></html>
//         `, {
//             status: 200,
//             headers: { "Content-Type": "text/html" }
//         });
//     } catch (error) {
//         console.error("Error exchanging code for tokens", error);
//         return new NextResponse(`
//             <html><body>
//                 <script>
//                     window.opener?.postMessage('google-oauth-error', '*');
//                     window.close();
//                 </script>
//                 <p>Authentication failed.</p>
//             </body></html>
//         `, {
//             status: 500,
//             headers: { "Content-Type": "text/html" }
//         });
//     }
// }





import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { ObjectId } from "mongodb";
import typedClientPromise from "@/db";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state"); // e.g., "<userId>__<assistantId>"

    if (!code || !state || !state.includes("__")) {
        return new NextResponse(`...error html...`, { status: 400, headers: { "Content-Type": "text/html" } });
    }

    const [userIdStr, assistantId] = state.split("__");
    let userId: ObjectId;
    try { userId = new ObjectId(userIdStr); } catch {
        return new NextResponse(`...error html...`, { status:400, headers: { "Content-Type": "text/html" } });
    }

    const oauth2Client = new google.auth.OAuth2(
        process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID_TORI_VAPI_GOOGLE_CAL,
        process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET_TORI_VAPI_GOOGLE_CAL,
        process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI_TORI_VAPI_GOOGLE_CAL
    );

    try {
        const { tokens } = await oauth2Client.getToken(code);

        const client = await typedClientPromise;
        const db = client.db();

        await db.collection("google-calendar-oauth-consent").updateOne(
            { userId, assistantId },
            {
                $set: {
                    code,
                    tokens,
                    updatedAt: new Date(),
                },
                $setOnInsert: {
                    userId,
                    assistantId,
                    createdAt: new Date(),
                },
            },
            { upsert: true }
        );

        return new NextResponse(`
            <html><body>
                <script>
                    window.opener?.postMessage('google-oauth-success', '*');
                    window.close();
                </script>
                <p>Google Calendar connected! You may close this window.</p>
            </body></html>
        `, { status: 200, headers: { "Content-Type": "text/html" } });
    } catch (error) {
        return new NextResponse(`...error html...`, { status: 500, headers: { "Content-Type": "text/html" } });
    }
}