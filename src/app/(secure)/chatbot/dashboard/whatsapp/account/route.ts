import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "../../../../../_helpers/server/api/api-handler";
import{connectDatabase} from '../../../../../../db';
import { ObjectId } from "mongodb";

module.exports = apiHandler({
    DELETE: deleteWhatsappData,
    GET: getWhatsappData,
  });

async function deleteWhatsappData(req: NextRequest) {
    //read the Object from the request
    let whatsAppId:any = req.nextUrl.searchParams.get("whatsAppDetailsId");
    const db = (await connectDatabase())?.db();
    const collection = db?.collection('whatsappbot_details');
    const deleteResult = await collection?.findOne({ _id: new ObjectId(whatsAppId) });

    if (deleteResult) {
      let result = await collection?.deleteOne({ _id: new ObjectId(whatsAppId) });

      if(result?.deletedCount > 0){
        return { message: "success" };
      }
      return { message: "error" };  
   
    }

    return { message: "error" };
}

async function getWhatsappData(req: NextRequest) {

    let userId:any = req.nextUrl.searchParams.get("userId");
    const db = (await connectDatabase())?.db();
    const collection = db?.collection('whatsappbot_details');
    const foundResult = await collection?.findOne({ userId: userId });

    if (foundResult) {
      return foundResult;
    }
    
    return { message: "error" };
}