import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "../../../../../../_helpers/server/api/api-handler";
import { generateAndGetToken } from "../../../../dashboard/services/vapi-services";
import { VapiClient } from "@vapi-ai/server-sdk";
import clientPromise from "../../../../../../../db";
import { ObjectId } from "mongodb";

module.exports = apiHandler({
    // GET: getAssistantList,//dashboard/api/assistant
    // DELETE:deleteSingleAssistant//dashboard/api/assistant
    // POST: importNumberToTwilio,
    // GET: getImportedTwilioDataFromDB,
    PUT: updateAssistantCallMetadata,//dashboard/api/assistant
    // DELETE: deleteSingleAssistant//dashboard/api/assistant
});

async function updateAssistantCallMetadata(req: NextRequest) {

    try{
        const assistantId:string = req.nextUrl.searchParams.get("assistantMId") as string;
    
        const data = await req.json();

        const db = (await clientPromise!).db();
        const voiceAssistantCollection = db?.collection("voice-assistance"); 

        const voiceAssistantRecord = await voiceAssistantCollection?.findOne({ 
            _id: new ObjectId(assistantId)
        });

        if(voiceAssistantRecord){
            if(data.totalCallLogs){
                const metaData = voiceAssistantRecord?.metadata || {};
                metaData.totalCallLogs = data.totalCallLogs || 0;
    
                await voiceAssistantCollection?.updateOne(
                    { _id: new ObjectId(assistantId) },
                    { $set: { metadata: metaData } }
                );
    
                return { message: 'Data received successfully' };
            }
            else if(data.lastUsed){
                const metaData = voiceAssistantRecord?.metadata || {};
                metaData.lastUsed = data.lastUsed || 0;
    
                await voiceAssistantCollection?.updateOne(
                    { _id: new ObjectId(assistantId) },
                    { $set: { metadata: metaData } }
                );
    
                return { message: 'Data received successfully' };

            }
            else if(data.lastTrained){//lastTrained
                const metaData = voiceAssistantRecord?.metadata || {};
                metaData.lastTrained = data.lastTrained || 0;
    
                await voiceAssistantCollection?.updateOne(
                    { _id: new ObjectId(assistantId) },
                    { $set: { metadata: metaData } }
                );
    
                return { message: 'Data received successfully' };
            }
           
        }

    }
    catch(error:any){
        console.error('Error parsing request body:', error);
        return { message  : error };
    }
}