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
  var characters = "ABCDE&#$FGHIJKLM@NOPQRSTUVWXTZ&abcdefghiklmno&*pqrstuvwx(yz";

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


async function saveWhatsappData(req: NextRequest) {
  const request = await req.json()
  const db = (await connectDatabase())?.db();


  const collection = await db?.collection('whatsappbot_details')
  // insert data into database

  const result = await collection?.insertOne({ ...request })

}



