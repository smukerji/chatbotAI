import { connectDatabase } from "@/db";
import { NextResponse } from "next/server";
require("dotenv").config();

export async function POST(request: Request) {
  try {
    const { accessToken, chatbotId } = await request.json();
    // check whether accessToken is valid or not
        
    const result = await fetch(
      `https://api.hubspot.com/account-info/v3/activity/security`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    const res = await result.json();
    // console.log("res",result)
    if (result.status == 200) {
      const db = (await connectDatabase())?.db();
      const collection = db.collection("user-chatbots");
      const res = await collection.findOne({ chatbotId: chatbotId });
      const setId = await collection.updateOne(
        { chatbotId: chatbotId },
        {
          $set: {
            access_token: accessToken,
          },
        }
      );
      // console.log("chatbotId", res);


      // This code is for fetching data from hubspot api 

      try {
        let result = await fetch(`${process.env.NEXT_PUBLIC_WEBSITE_URL}chatbot/dashboard/Hubspot/tasks`,{
          method:'POST',
          body:JSON.stringify({chatbotId,accessToken})
        })
        let res = await result.json()
        console.log("res",res)
    } catch (error) {
      return NextResponse.json({message:'failed to get data from hubspot'})
    }


      return NextResponse.json({ message: "success" });
    }
    else{
        return NextResponse.json({ message: "your token is invalid " });
    }
   

  } catch (error) {
    return NextResponse.json({ message: "Internal server error" });
  }
}