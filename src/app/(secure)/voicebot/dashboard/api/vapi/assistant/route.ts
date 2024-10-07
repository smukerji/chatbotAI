import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "../../../../../../_helpers/server/api/api-handler";
import clientPromise from "../../../../../../../db";
import { ObjectId } from "mongodb";

module.exports = apiHandler({
    POST: createVapiAssistant
  });

  //  voicebot/dashboard/api/template
async function createVapiAssistant(req: NextRequest) {

    try {

        const db = (await clientPromise!).db();
        const collection = db?.collection("voice-assistance");
        const voicBotData = await req.json();

        // Convert assistantTemplateIDs to ObjectId
        if (voicBotData.assistantTemplateIDs && Array.isArray(voicBotData.assistantTemplateIDs)) {
            voicBotData.assistantTemplateIDs = voicBotData.assistantTemplateIDs.map((id: string) => new ObjectId(id));
        }
        if(voicBotData.userId && typeof voicBotData.userId === "string"){
            voicBotData.userId = new ObjectId(voicBotData.userId);
        }
        
        const result = await collection?.insertOne(voicBotData);
        return { result };
        
    }
    catch (error: any) {
        return { error: error.message };
    }

}