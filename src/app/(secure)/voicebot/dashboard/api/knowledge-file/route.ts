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

        const recordId = req.nextUrl.searchParams.get("recordId") as string;
        const fileId = req.nextUrl.searchParams.get("fileId") as string;
        const result = await userFileKnowledge?.deleteOne({ _id: new ObjectId(recordId), "fileData.id": fileId });

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

        console.log("knowledge base your assistant id", assistantIdT);

        // Use $and for userId and assistantId
        const userKnowledgeFiles =  await userFileKnowledge?.find({
            $and: [
                { userId: new ObjectId(userId) },
                { assistantId: assistantIdT }
            ]
        }).toArray();
        console.log("knowledge base user knowledge files", userKnowledgeFiles);

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
