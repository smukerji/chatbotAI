import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from '../../../../../_helpers/server/api/api-handler'

module.exports = apiHandler({
    POST: receivingRequestFromTelegram,
    // GET: getChatBotSettings,
  });
  

// export async function GET(request: NextRequest) {
//     // let req = await request.json()
//     return NextResponse.json({message:'success'})
// }
 async function receivingRequestFromTelegram(request:NextRequest){
    let req= await request.json()
    const chatId = req?.message?.chat?.id;
   const telegramToken = request?.nextUrl?.searchParams.get('token')
   
   
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