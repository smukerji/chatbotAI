import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "../../../../../_helpers/server/api/api-handler";
import { generateAndGetToken } from "../../../dashboard/services/vapi-services";
import { VapiClient } from "@vapi-ai/server-sdk";
import clientPromise from "../../../../../../db";
import { ObjectId } from "mongodb";

module.exports = apiHandler({
    PUT: updateUserVoicebotCostCredits,//dashboard/api/costs-wallates
});

async function updateUserVoicebotCostCredits(req: NextRequest) {
    try{

        const userId = req.nextUrl.searchParams.get("userId") as string;

        const data: {assistantId:string} = await req.json();
 
        // prepare the db connections
        const db = (await clientPromise!).db();

        const token = await generateAndGetToken();

        // get the vapi instance
        const client = new VapiClient({ token});

        // get the call logs
        const callLogsList = await client.calls.list({
            assistantId: data.assistantId,
            limit:1
        });

        // extract the cost of the call
        const callCost:number = callLogsList[0].cost || 0;

        // get the user's voice credits
        const usersDetailsCollection = db?.collection("user-details");
        const userRecord = await usersDetailsCollection?.findOne({ userId: userId});

        // if the user has credits
        if(userRecord.voicebotDetails && userRecord.voicebotDetails.credits){
            // deduct the cost from the user's voice credits (adding in 30% margin to the cost)
            userRecord.voicebotDetails.credits -= callCost * 1.3;

            // update the user's voice credits
            await usersDetailsCollection?.updateOne(
                { userId: userId },
                { $set: { voicebotDetails: userRecord.voicebotDetails } }
            );

            const updatedCreditsRecord = await usersDetailsCollection?.findOne({ userId: userId});

            return { message: 'credits updated', data: updatedCreditsRecord.voicebotDetails.credits };

        }
        else{
            return { message: 'No credits found for this user' };
        }

    }
    catch(error:any){
        console.error('Error parsing request body:', error);
        return { message  : error };
    }
}