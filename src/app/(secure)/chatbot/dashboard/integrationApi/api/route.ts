import { apiHandler } from "@/app/_helpers/server/api/api-handler";
import { connectDatabase } from "@/db";
import { ObjectId } from "mongodb";

module.exports = apiHandler({
    GET: whatsAppStatusCheck,
  });
  
  async function whatsAppStatusCheck(request: any) {
    const params = await request.nextUrl.searchParams;
    const userId = params.get("userId");
  console.log(userId)
    /// fetch the data sources of the Users
    const db = (await connectDatabase())?.db();
    const collection = db?.collection("users");
    try{
        const data = await collection.findOne({ _id:new ObjectId(userId) });
        
        return {isWhatsappVerified : data?.isWhatsapp}
    }
    catch(error){
       return{error:'unable to get whatsapp status'}
        
    }
  }
  