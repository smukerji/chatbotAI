import { connectDatabase } from "@/db";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
   
    //read the incomming parameter from webhook
    let resData:any = await req.json();
  
    console.log('collection', resData);
    // return {
    //     challenge: resData.challenge
    // }
    return new Response(JSON.stringify({ challenge: resData.challenge }), { status: 200 });
    const db = (await connectDatabase())?.db();
    const collection = db?.collection('slack-bot_details');
    //find the token in database
    // const tokenDetails = await collection?.findOne({ webhook_verification_token: hubToken });
    // if (
    //   hubMode === "subscribe" &&
    //   hubToken === tokenDetails?.webhook_verification_token
    //   // hubToken === process.env.WHATSAPPCALLBACKTOKEN
    // ) {
  
    //   // find whome the hubToken belongs to and update the isTokenVerified to true
    //   const tokenDetails = await collection?.findOne({ webhook_verification_token: hubToken });
    //   if (tokenDetails) {
    //     await collection?.updateOne({ webhook_verification_token: hubToken }, { $set: { isTokenVerified: true } });
    //   }
  
    //   console.log('verified successfully');
    //   return new Response(hubChallenge);
    // }
  
    return new Response("Invalid Credentials", { status: 400 });
  }
  