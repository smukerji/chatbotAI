import { connectDatabase } from "@/db";
import { NextRequest, NextResponse } from "next/server";

// import { }
import { createEventAdapter } from '@slack/events-api';
const slackSigngingSecret = '73975faec29aaa00bd9810d50b64423d';
const slackEvents = createEventAdapter(slackSigngingSecret);


export async function POST(req: NextRequest) {

  try {

    //read the incomming parameter from webhook
    let resData: any = await req.json();
    // console.log('resData', resData);
    // slackEventsQueue.add('incommingMessage',{data:resData});
    writeInDataBase(resData);
    return new NextResponse('', { status: 200 });
    if (resData.challenge) {
      // return new Response(JSON.stringify({ challenge: resData.challenge }), { status: 200 });
      new NextResponse(JSON.stringify({ challenge: resData.challenge }), { status: 200 });

      let prom = new Promise((resolve, reject) => {
        setTimeout(() => {
          resolve('done');
        }, 1000);
      }
      );

      let result = await prom;
      console.log('result', result);

    }
    else {
     if(resData.event.type === 'app_mention'){
      //  console.log('app_mention',resData.event);
      //  console.log('app_mention',resData.event.text);

      //  slackEventsQueue.add({ event: resData });
      new NextResponse('', { status: 200 });

      console.log("printing the response from slack bot\t",resData.event.text);

      //  return new Response('', { status: 200 });

     }

    }

    console.log('collection', resData);
    // return {
    //     challenge: resData.challenge
    // }
    // return new Response(JSON.stringify({ challenge: resData.challenge }), { status: 200 });
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

    // return new Response("Invalid Credentials", { status: 400 });
  }
  catch (error: any) {
    console.log('error', error);
  }

}


async function writeInDataBase(data:any){
  try{
    let prom = new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve({
          data: data
        });
      }, 5000);
    });

    let result = await prom;
    console.log('result', result);
  }
  catch(error:any){
    console.log('error',error);
  }
  // slackEventsQueue.add('incommingMessage',{data:'test'});
}


// slackEventsQueue.process(async(job:any,done:any)=>{

//   const event = job;

//   console.log('event',event);

//   done();
// })


  