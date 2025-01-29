import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "../../../../../_helpers/server/api/api-handler";
import clientPromise from "../../../../../../db";
import { ObjectId } from "mongodb";

module.exports = apiHandler({
    GET: getAssistantList, //dashboard/api/assistant
    DELETE:deleteSingleAssistant, //dashboard/api/assistant
    POST: giveFreeCreditsToUser //dashboard/api/assistant
});

async function giveFreeCreditsToUser(req: NextRequest) {
    
        try {
            const userID:string = req.nextUrl.searchParams.get("userId") as string;
            const db = (await clientPromise!).db();
            const collection = db?.collection("user-details");
            const user = await collection?.findOne({ userId: userID });
            if(user){
                //add voicebotDetails.credit to user's wallet if credit not exist
                if(!user?.voicebotDetails?.credit){
                    const result = await collection?.updateOne(
                        { userId: userID },
                        { $set: { "voicebotDetails.credits": 10 } }
                    );
                    if(result.modifiedCount){
                        return {message: "Free credits added successfully"};
                    } else {
                        return {error: "Failed to add free credits"};
                    }
                }

                return {message: "User already have free credits"};

            }
            return {error: "User not found"};
            
        } catch (error: any) {
            return `{error: ${error.message}}`;
        }
}

async function deleteSingleAssistant(req: NextRequest) {

    try {
        const assistanceId = req.nextUrl.searchParams.get("assistanceId") as string;
        const db = (await clientPromise!).db();
        const voiceAssistantCollection = db?.collection("voice-assistance");        
        //find the record
        const recordResult = await voiceAssistantCollection?.findOne({_id: new ObjectId(assistanceId)});
        if(recordResult){
            //update the record
            const result = await voiceAssistantCollection?.updateOne(
                { _id: new ObjectId(assistanceId) },
                { $set: { isDeleted: true } }
            );
            if(result.modifiedCount){
                return {message: "Record deleted successfully"};
            } else {
                return {error: "Failed to delete record"};
            }
        }
        return {error: "Record not found"};
        
    } catch (error: any) {
        return `{error: ${error.message}}`;
    }
        
}

async function getAssistantList(req: NextRequest) {


    try {

        const userID:string = req.nextUrl.searchParams.get("userId") as string;
        const db = (await clientPromise!).db();
        const collection = db?.collection("voice-assistance");
        // const assistants = await collection?.find({ userId: new ObjectId(userID) }).toArray();
        const assistants = await collection?.aggregate([
            { $match: { userId: new ObjectId(userID) , isDeleted:false} },
            {
                $lookup: {
                    from: "voice-assistance-template",
                    localField: "assistantTemplateIDs",
                    foreignField: "_id",
                    as: "templateDetails"
                }
            }
        ]).toArray();

        return { assistants } ;

        // return { message : "got the message"};        
    }
    catch (error: any) {
        return { error: error.message };
    }

}
