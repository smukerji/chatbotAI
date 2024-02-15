import { NextRequest, NextResponse } from "next/server";
// import { NextApiResponse } from "next";

export async function GET(req: NextRequest) {
  let hubMode = req.nextUrl.searchParams.get("hub.mode");
  let hubChallenge = req.nextUrl.searchParams.get("hub.challenge");
  let hubToken = req.nextUrl.searchParams.get("hub.verify_token");

  if (
    hubMode === "subscribe" &&
    hubToken === process.env.WHATSAPPCALLBACKTOKEN
  ) {
    console.log("Whatsapp calling",req)
    return new Response(hubChallenge);
  } 

  return new Response('Invalid Credentials',{status:400})

}

export async function POST(req:NextRequest){
  let res:any = await req.json()

  console.log('getting requet from meta ',res?.entry[0]?.changes[0]?.value?.messages[0]?.text?.body)

}
