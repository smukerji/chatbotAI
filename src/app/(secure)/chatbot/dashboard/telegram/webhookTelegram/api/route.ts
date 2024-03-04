import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from '../../../../../../_helpers/server/api/api-handler';
import { connectDatabase } from "../../../../../../../db";




 async function getChatbotId(telegramToken:any){
    const db = (await connectDatabase())?.db();
    const collection = db?.collection('telegram-bot');
    const {chatbotId,userId} = await collection?.findOne({ telegramToken });
    return {chatbotId,userId}
}
  

export async function POST(request:NextRequest){
    let req= await request.json()
    const chatId = req?.message?.chat?.id;
   const telegramToken = request?.nextUrl?.searchParams.get('token')
   

// This code is for getting chatbotId from telegram token

const {chatbotId,userId} =await  getChatbotId(telegramToken)
// if(userId){
//     // write pinecone and open ai code 
//      // if we have user id
//      const response: any = await fetch(
//         `${process.env.NEXT_PUBLIC_WEBSITE_URL}api/pinecone`,
//         {
//           method: "POST",
//           body: JSON.stringify({
//             userQuery: ,
//             chatbotId: chatbotId,
//             userId: userId,
//           }),
//         }
//       );
// }






    //--------------- This code is for sending message to telegram 
    const url = `https://api.telegram.org/bot${telegramToken}/sendMessage`;

    const body = {
        chat_id: chatId,
        text: 'hello programmatically'
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        const responseData = await response.json();
    } catch (error) {
        console.log('Error sending message to Telegram:', error);
        
    }
    return NextResponse.json({message:'success'})
}