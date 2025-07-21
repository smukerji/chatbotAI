
//working code for userid...
// import { NextRequest, NextResponse } from "next/server";
// import typedClientPromise from "@/db";
// import { cookies } from "next/headers";
// import { ObjectId } from "mongodb";

// export async function GET(req: NextRequest) {
//   const cookieStore = cookies();
//   const userIdStr = cookieStore.get("userId")?.value;

//   if (!userIdStr) return NextResponse.json({ connected: false });

//   let userId: ObjectId;
//   try { userId = new ObjectId(userIdStr); } catch { return NextResponse.json({ connected: false }); }

//   const client = await typedClientPromise;
//   const db = client.db();
//   const data = await db.collection("google-calendar-oauth-consent").findOne({ userId });

//   if (data && data.tokens && data.code) {
//     return NextResponse.json({ connected: true });
//   }
//   return NextResponse.json({ connected: false });
// }




import { NextRequest, NextResponse } from "next/server";
import typedClientPromise from "@/db";
import { cookies } from "next/headers";
import { ObjectId } from "mongodb";

export async function GET(req: NextRequest) {
    const cookieStore = cookies();
    const userIdStr = cookieStore.get("userId")?.value;
    const assistantId = req.nextUrl.searchParams.get("assistantId");

    if (!userIdStr || !assistantId) return NextResponse.json({ connected: false });

    let userId: ObjectId;
    try { userId = new ObjectId(userIdStr); } catch { return NextResponse.json({ connected: false }); }

    const client = await typedClientPromise;
    const db = client.db();
    const data = await db.collection("google-calendar-oauth-consent").findOne({ userId, assistantId });

    if (data && data.tokens && data.code) {
        return NextResponse.json({ connected: true });
    }
    return NextResponse.json({ connected: false });
}