import { NextRequest } from "next/server";
import { apiHandler } from "../../../../../../_helpers/server/api/api-handler";
import { connectDatabase } from "../../../../../../../db";



module.exports = apiHandler({
    POST: setTelegramToken,
  });
  
async function setTelegramToken(request:NextRequest){
    const{chatbotId,telegramToken} = await request.json();
    
    const db = (await connectDatabase())?.db();
  const collection = db?.collection("telegram-bot");
  if(await collection.findOne({chatbotId:chatbotId})){
    return{message:'already linked',linked:true}
  }else{
    
      await collection.insertOne({chatbotId,telegramToken})
  }
return {message:'success'}

}