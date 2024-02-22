import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "../../../../../_helpers/server/api/api-handler";
import{connectDatabase} from '../../../../../../db';
module.exports = apiHandler({
  POST: saveWhatsappData,
  GET: getCallBackUrl,
});
// This function will generate a random string
function generateRandomString() {
  //define a variable consisting alphabets in small and capital letter
  var characters = "ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";

  //specify the length for the new string
  var lenString = 7;
  var randomstring = "";

  //loop to select a new character in each iteration
  for (var i = 0; i < lenString; i++) {
    var rnum = Math.floor(Math.random() * characters.length);
    randomstring += characters.substring(rnum, rnum + 1);
  }

  return randomstring.toUpperCase();
}


// This is get method for generation webhook verification token
async function getCallBackUrl(req: NextRequest, res: NextResponse) {
  const randomString = generateRandomString();
    
  return { webhook_verification_token: randomString };
}


async function saveWhatsappData(req:NextRequest){
    const request = await req.json()
    const db = (await connectDatabase())?.db();

   
    const collection = await db?.collection('whatsApp-details')
    const result = await collection?.insertOne({...request})

if(result){
    return{message:'data saved successfully'}
}  
   return{message:'Error saving data'}
}




