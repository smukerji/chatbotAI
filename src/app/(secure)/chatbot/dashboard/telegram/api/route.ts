import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    // let req = await request.json()
    return NextResponse.json({message:'success'})
}
export async function POST(request:NextRequest){
    let req= await request.json()
    const chatId = req?.message?.chat?.id;
   
    // This code is for sending message to telegram 
    const url = `https://api.telegram.org/bot${process.env.TELEGRAMTOKEN}/sendMessage`;

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