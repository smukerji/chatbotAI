import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "../../../../../_helpers/server/api/api-handler";
import clientPromise from "../../../../../../db";
import { ObjectId } from "mongodb";
import { VoiceBotData,VoiceData } from "./types";

module.exports = apiHandler({
    POST: createVoiceBot,// dashboard/api/voice
    PUT: updateVoiceBot,
  });

async function createVoiceBot(req: NextRequest) {

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
        let insertData:VoiceData = {...voicBotData, isDeleted: false};
        
        const result = await collection?.insertOne(insertData);
        if(result.insertedId){
            const insertedRecord = await collection?.findOne({ _id: result.insertedId });
            return { record: insertedRecord , result};
        } else {
            return { error: "Failed to insert record" };
        }
    }
    catch (error: any) {
        return { error: error.message };
    }

}

async function updateVoiceBot(req: NextRequest) {
    try {
        const db = (await clientPromise!).db();
        const collection = db?.collection("voice-assistance");
        /**
         *  
         * body: JSON.stringify({
                    assistantName: voiceAssistantName,
                    assistantTemplateIDs: assistantTemplateIDs,
                    imageUrl: imagePath,
                    recordId: acknowledgedData?.insertedId
                  });
         */
        
        let { assistantName, assistantTemplateIDs, imageUrl, recordId } = await req.json();
         // Convert assistantTemplateIDs to ObjectId
         if (assistantTemplateIDs && Array.isArray(assistantTemplateIDs)) {
            assistantTemplateIDs = assistantTemplateIDs.map((id: string) => new ObjectId(id));
        }
        const objectID = new ObjectId(recordId);
        const result = await collection?.updateOne({ _id: objectID }, { $set: { assistantName, assistantTemplateIDs, imageUrl } });
        return { result };
    } catch (error: any) {
        return { error: error.message };
    }
}