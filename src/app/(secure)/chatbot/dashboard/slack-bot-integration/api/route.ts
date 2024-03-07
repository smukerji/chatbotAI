import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "../../../../../_helpers/server/api/api-handler";
import{connectDatabase} from '../../../../../../db';
import validator  from 'validator';

module.exports = apiHandler({
    POST: saveSlackAppData,
    GET:getSlackAppData
  });

interface SlackAppData {
  _id?:string;
  appId:string;
  userId:string;
  authOToken:string;
  chatBotId:string;
}

export async function getSlackAppData(req: NextRequest) {
  try {

    //read the chatBotId
    let chatBotId:any = req.nextUrl.searchParams.get("chatBotId");
    //if not valid chatBotId then return error
    if(!validator.isUUID(chatBotId)){
      return { status: 400, message: "Invalid chatBotId" }
    }

    const db = (await connectDatabase())?.db();
    let slackCollection:any = db.collection('slack-app-details');
    let appDetails:SlackAppData = await slackCollection.findOne({
      chatBotId:chatBotId
    })
    // throw new Error('Unhandle exceptions');

    if(!appDetails){
      return { status: 400, message: "No slack app found" }
    }

    return {  message: "Details received.",data:appDetails }
  }
  catch (error: any) {
    return { status: 503, message: error.message }
  }
}

async function saveSlackAppData(req: NextRequest) {

  try {
    let slackAppData: SlackAppData = await req.json();
    console.log('slackAppData', slackAppData);
    const db = (await connectDatabase())?.db();

    //check if the chatBotId is exist
    let chatbotCollection = db.collection('user_chatbots');
    let chatBotDetails = await chatbotCollection.findOne({ _id: slackAppData.chatBotId });
    if (!chatBotDetails) {
      return { status: 400, message: "Chatbot not available" }
    }

    
   
    let collection = db.collection('slack-app-details');

    //find if the app is already registered
    let appDetails = await collection.findOne({ appId: slackAppData.appId });
    if (appDetails) {
      //update the app details
      await collection.updateOne({ appId: slackAppData.appId }, { $set: slackAppData });
    }
    else {
      //insert the app details
      await collection.insertOne(slackAppData);
    }

    return { message:"Your slack connected!" }
  }
  catch (error: any) {
    return { status: 400, message: error.message }
  }

}