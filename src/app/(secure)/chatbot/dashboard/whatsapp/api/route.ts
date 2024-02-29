import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "../../../../../_helpers/server/api/api-handler";
import{connectDatabase} from '../../../../../../db';
import { v4 as uuidv4 } from 'uuid';

module.exports = apiHandler({
  POST: saveWhatsappData,
  GET: getCallBackUrl,
  PUT: isWhatsAppTokenVerified
});
// This function will generate a random string
function generateUniqueToken() {
  return uuidv4();
}

// This is get method for generation webhook verification token
async function getCallBackUrl(req: NextRequest) {
  const randomString = generateUniqueToken();
  // const request = await req.json();
  let chatBotId = req.nextUrl.searchParams.get("chatBotId");


  //insert the token into database
  const db = (await connectDatabase())?.db();
  const collection = db?.collection('whatsappbot_details');

  //find the user based on the chatbot id
  const userCollection = db?.collection('user-chatbots');
  const user = await userCollection?.findOne({ chatbotId: chatBotId });

  //find user with chatbot id in whatsappbot_details on token verified false then send the token
  const tokenDetails = await collection?.findOne({ chatbotId: chatBotId });
  if (tokenDetails) {
    return { webhook_verification_token: tokenDetails.webhook_verification_token, whatsAppDetailId: tokenDetails._id };
  }

  // insert data into database
  let result = await collection?.insertOne({ webhook_verification_token: randomString, userId: user.userId, chatbotId: chatBotId, isTokenVerified: false,isEnabled:true})


  return { webhook_verification_token: randomString, whatsAppDetailId: result?.insertedId };
}



async function saveWhatsappData(req: NextRequest) {

  try {
    const request = await req.json()
    const db = (await connectDatabase())?.db();

    const collection = db?.collection('whatsappbot_details');
    //if given chatbot id is not linked with enable whatsapp bot then return error
    let findResult: any = await collection?.findOne({
      chatbotId: {
        $ne: request.chatbotId
      }, isEnabled: true, phoneNumberID: request.phoneNumberID, phoneBusinessID: request.phoneBusinessID
    });
    if (findResult) {

      return { message: `WhatsApp Business Account already linked with another bot`, status: 403 };
      //find the chatbot which is already linked with the given phone number
      let findChatbotResult = await collection?.aggregate([
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
      ]).toArray();

      //if login user has already linked with another bot then 
      if(findChatbotResult[0]["userId"] == findChatbotResult[0]["userChatbotData"][0]["userId"]){
        return { message: `already linked with '${findChatbotResult[0]["userChatbotData"][0]["chatbotName"] ? findChatbotResult[0]["userChatbotData"][0]["chatbotName"] : 'Another' }' bot!`, status: 403 };
      }
      else{
        return {message:`already linked with another bot!`, status: 403};
      }
 
      return { message: `already linked with '${findChatbotResult[0]["userChatbotData"][0]["chatbotName"] ? findChatbotResult[0]["userChatbotData"][0]["chatbotName"] : 'Another' }' bot!`, status: 403 };
      // return  Response(`already linked with '${findChatbotResult[0]["userChatbotData"][0]["chatbotName"]}' bot!`,{status:400});
      // return NextResponse.json({ message: `already linked with '' bot!` });
      // return new NextResponse(`already linked with '${findChatbotResult[0]["userChatbotData"][0]["chatbotName"]}' bot!`,{status:400});
    }
 
    //if data exist based on the chatbot id then update the data

    const tokenDetails = await collection?.findOne({ chatbotId: request.chatbotId, isTokenVerified: true, userId: request.userId });

    if (tokenDetails) {
      await collection?.updateOne({ chatbotId: request.chatbotId, isTokenVerified: true, userId: request.userId }, { $set: { ...request } });
      return { message: "success" };
    }
  }
  catch (error: any) {
    //return error respose
    return { message: "error!", status: 503 };
  }

}

async function isWhatsAppTokenVerified(req: NextRequest) {

  let whatsAppToken = req.nextUrl.searchParams.get("whatsAppVerifyToken");

  const db = (await connectDatabase())?.db();
  const collection = db?.collection('whatsappbot_details');
  const tokenDetails = await collection?.findOne({ webhook_verification_token: whatsAppToken });

  return {
   verifyMessage : tokenDetails?.isTokenVerified ? "verified token" : "invalid token",
   verifyValue: tokenDetails?.isTokenVerified ? true : false
  }

}




