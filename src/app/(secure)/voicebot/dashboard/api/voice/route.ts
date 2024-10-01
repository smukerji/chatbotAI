import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "../../../../../_helpers/server/api/api-handler";
import clientPromise from "../../../../../../db";
import { ObjectId } from "mongodb";

module.exports = apiHandler({
    POST: createVoiceBot,
    PUT: updateVoiceBot,
  });

async function createVoiceBot(req: NextRequest) {

    try {

        const db = (await clientPromise!).db();
        const collection = db?.collection("voice-assistance");
        const voicBotData = await req.json();
        const result = await collection?.insertOne(voicBotData);
        return { result };
        
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
        
        const { assistantName, assistantTemplateIDs, imageUrl, recordId } = await req.json();
        const objectID = new ObjectId(recordId);
        const result = await collection?.updateOne({ _id: objectID }, { $set: { assistantName, assistantTemplateIDs, imageUrl } });
        return { result };
    } catch (error: any) {
        return { error: error.message };
    }
}