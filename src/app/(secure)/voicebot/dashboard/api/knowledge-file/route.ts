import { VapiClient } from "@vapi-ai/server-sdk";
import clientPromise from "../../../../../../db";
import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "../../../../../_helpers/server/api/api-handler";
import { generateAndGetToken } from "../../services/vapi-services";

module.exports = apiHandler({

    POST: storeFileKnowledgeData,
    GET: getUserKnowledgFilesByUserId,
    DELETE: deleteUserFileKnowledgeData,
});

async function deleteUserFileKnowledgeData(req: NextRequest) {
    try {
        const db = (await clientPromise!).db();
        const userFileKnowledge = db?.collection("user-file-knowledge"); // Change to your collection name

        const userId = req.nextUrl.searchParams.get("userId") as string;
        const fileId = req.nextUrl.searchParams.get("fileId") as string;
        const result = await userFileKnowledge?.deleteOne({ userId: new ObjectId(userId), "fileData.id": fileId });

        if (result?.deletedCount === 1) {
            return { message: 'Knowledge data deleted successfully!', status: 200 };
        } else {
            return { message: 'No knowledge data found to delete.', status: 404 };
        }
    }
    catch (error: any) {
        console.error('Error deleting knowledge data:', error);
        if (error.body) {
            return { message: error.body }
        }
        return { message: error, status: 500 };
    }
}

async function storeFileKnowledgeData(req: NextRequest) {

    try {
        const data = await req.json(); // Parse the request body as JSON
        const db = (await clientPromise!).db();
        const userFileKnowledge = db?.collection("user-file-knowledge"); // Change to your collection name
        
        await userFileKnowledge?.insertOne({
            fileData: data.fileData,
            userId: new ObjectId(data.userId),
            assistantId: data.assistantId,
        });

        return { message: 'Knowledge data acknowledge successfully!' , status: 200 };


    }
    catch(error:any){
        console.error('Error parsing request body:', error);
        if(error.body){
            return { message: error.body }
        }
        return { message: error, status: 500 };
    }

}

async function getUserKnowledgFilesByUserId(req:NextRequest){
    try {

        const db = (await clientPromise!).db();
        const userFileKnowledge = db?.collection("user-file-knowledge"); // Change to your collection name

        const userId = req.nextUrl.searchParams.get("userId") as string;
        // const route = req.nextUrl.searchParams.get("route") as string;
        const assistantIdT = req.nextUrl.searchParams.get("assistantId") as string;

        // Use $and for userId and assistantId
        const userKnowledgeFiles =  await userFileKnowledge?.find({
            $and: [
                { userId: new ObjectId(userId) },
                { assistantId: assistantIdT }
            ]
        }).toArray();
        // if(route == "model" && assistantIdT){
        //     // Get all voice-assistant records for this user
        //     const voiceAssistantCol = db?.collection("voice-assistance");//voice-assistance

        //     const voiceAssistants = await voiceAssistantCol?.find({ userId: new ObjectId(userId) }).toArray();

        //     // Collect fileIds that are linked to this assistantIdT
        //     const fileIdsWithAssistant = new Set(
        //         voiceAssistants
        //             .filter((va: any) => va.vapiAssistantId === assistantIdT)
        //             .map((va: any) => va.fileId)
        //     );

        //     // Collect all fileIds in voice-assistant for this user (excluding those with assistantIdT)
        //     const fileIdsInVoiceAssistant = new Set(
        //         voiceAssistants
        //             .filter((va: any) => va.vapiAssistantId !== assistantIdT)
        //             .map((va: any) => va.fileId)
        //     );

        //     // Only include userKnowledgeFiles whose fileData.id is NOT in fileIdsInVoiceAssistant,
        //     // OR if fileData.id is in fileIdsWithAssistant (exception case)
        //     const filtered = userKnowledgeFiles?.filter((record: any) => {
        //         const fileId = record.fileData?.id;
        //         if (!fileId) return false;
        //         if (fileIdsWithAssistant.has(fileId)) return true; // exception: keep if linked to assistantIdT
        //         return !fileIdsInVoiceAssistant.has(fileId);
        //     });

        //     return ({ data: filtered, status: 200 });
        // }
        // else if(route == "knowledge"){
        // else{
            // return ({ data: userKnowledgeFiles, status: 200 });

        // }


        return ({ data: userKnowledgeFiles, status: 200 });

      
    }
    catch(error:any){
        console.error('Error parsing request body:', error);
        if(error.body){
            return { message: error.body }
        }
        return { message: error, status: 500 };

    }

}
