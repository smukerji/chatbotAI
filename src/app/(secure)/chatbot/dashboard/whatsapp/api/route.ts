import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "../../../../../_helpers/server/api/api-handler";
import{connectDatabase} from '../../../../../../db';

import { getServerSession } from "next-auth";
import { v4 as uuidv4 } from 'uuid';
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ObjectId } from "mongodb";

module.exports = apiHandler({
  POST: saveWhatsappData,
  GET: getCallBackUrl,
  PUT: isWhatsappTokenVerified
});
// This function will generate a random string
function generateUniqueToken() {
  return uuidv4();
}

// This is get method for generation webhook verification token
async function getCallBackUrl(req: NextRequest) {
  const randomString = generateUniqueToken();
  // const request = await req.json();
  let chatBotId:string = req.nextUrl.searchParams.get("chatBotId") as string;

  /// get the session and then access the id
  const session: any = await getServerSession(authOptions);
  const userId = req?.headers.get("userId")
    ? req?.headers.get("userId")
    : session?.user?.id;

  //insert the token into database
  const db = (await connectDatabase())?.db();
  const collection = db?.collection('whatsappbot_details');

  //find the user based on the chatbot id
  const userCollection = db?.collection('user-chatbots');
  // const user = await userCollection?.findOne({ chatbotId: chatBotId });
  //check if chatbot exist or not
  const chatbotExistResult:any = await isChatBotExist({chatbotId: chatBotId, userId : userId }, db);
  if(chatbotExistResult === false){
    return { message: `The given chatbot doesn't exist`, status: 404 };
  }
  if(typeof(chatbotExistResult) === "string"){
    throw new Error(chatbotExistResult);
  }

  //find user with chatbot id in whatsappbot_details on token verified false then send the token
  const tokenDetails = await collection?.findOne({ chatbotId: chatBotId });
  if (tokenDetails) {
    return { webhook_verification_token: tokenDetails.webhook_verification_token, whatsAppDetailId: tokenDetails._id };
  }

  // insert data into database
  let result = await collection?.insertOne({ webhook_verification_token: randomString, userId: chatbotExistResult.userId, chatbotId: chatBotId, isTokenVerified: false,isEnabled:true})


  return { webhook_verification_token: randomString, whatsAppDetailId: result?.insertedId };
}



async function saveWhatsappData(req: NextRequest) {

  try {
    const request = await req.json()
    const db = (await connectDatabase())?.db();

    //check if the given chatbot exist or not
    const chatbotExistResult: any = await isChatBotExist({ userId: request.userId, chatbotId: request.chatbotId }, db);
    if(chatbotExistResult === false){
      return { message: `The given chatbot doesn't exist`, status: 404 };
    }
    if(typeof(chatbotExistResult) === "string"){
      throw new Error(chatbotExistResult);
    }

    const collection = db?.collection('whatsappbot_details');
    const userBotCollection = db?.collection('user-chatbots');
    //if same user trying to link the same phone number with another bot then return the error message
    let findResult: any = await collection?.findOne({
      chatbotId: {
        $ne: request.chatbotId
      }, isEnabled: true, phoneNumberID: request.phoneNumberID, phoneBusinessID: request.phoneBusinessID,
      userId: request.userId
    });

    if (findResult) {

      //read the chatbot name which are connected
      let cursor = await collection?.aggregate([
        {
          $match: {
            isEnabled: true,
            phoneNumberID: request.phoneNumberID,
            phoneBusinessID: request.phoneBusinessID
          }
        },
        {
          $lookup: {
            from: "user-chatbots",
            localField: "chatbotId",
            foreignField: "chatbotId",
            as: "userChatbotData"
          }
        }
      ]);
      
      let findChatbotResult = await cursor.toArray();

      await cursor.close();


      return { message: `WhatsApp Business Account already linked with '${findChatbotResult[0]["userChatbotData"][0]["chatbotName"]}' bot`, status: 403 };
      //find the chatbot which is already linked with the given phone number
    }

    //if another user trying to link the same phone number with any bot then return the error message
    let findAnotherUserResult: any = await collection?.findOne({
      chatbotId: {
        $ne: request.chatbotId
      }, isEnabled: true, phoneNumberID: request.phoneNumberID, phoneBusinessID: request.phoneBusinessID,
      userId: {
        $ne: request.userId
      }
    });

    if (findAnotherUserResult) {
      return { message: `WhatsApp Business Account already linked with another bot`, status: 403 };
    }

    //if data exist based on the chatbot id then update the data

    const tokenDetails = await collection?.findOne({ chatbotId: request.chatbotId, isTokenVerified: true, userId: request.userId });

    if (tokenDetails) {
      const {id , ...rest} = request;
      // await collection?.updateOne({ chatbotId: request.chatbotId, isTokenVerified: true, userId: request.userId }, { $set: { ...request } });
      let updatedResult = await collection?.updateOne({ _id: new ObjectId(id) }, { $set: { ...rest } });

      if(updatedResult.modifiedCount > 0){
        return { message: "success" };
      }
      throw new Error("No any WhatsApp record found!");
      // return { message: "success" };
    }

    throw new Error("No any WhatsApp record found!");

  }
  catch (error: any) {
    //return error respose
    return { message:error.message, status: 503};
  }

}

async function isWhatsappTokenVerified(req: NextRequest) {

  let whatsAppToken = req.nextUrl.searchParams.get("whatsAppVerifyToken");

  const db = (await connectDatabase())?.db();
  const collection = db?.collection('whatsappbot_details');
  const tokenDetails = await collection?.findOne({ webhook_verification_token: whatsAppToken });

  return {
   verifyMessage : tokenDetails?.isTokenVerified ? "verified token" : "invalid token",
   verifyValue: tokenDetails?.isTokenVerified ? true : false
  }

}

//check if chatbot exist based on the chatbot id
async function isChatBotExist(data: { userId: string, chatbotId: string }, db: any): Promise<boolean | object | String> {

  try {
    const collection = db?.collection('user-chatbots');
    const chatBot = await collection?.findOne({ chatbotId: data.chatbotId, userId: data.userId});
    if (chatBot) {
      return chatBot;
    }
    return false;
  }
  catch (error: any) {
    return error.message;
  }

}




