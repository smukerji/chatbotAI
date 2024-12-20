import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "../../../../../../_helpers/server/api/api-handler";
import { generateAndGetToken } from "../../../../dashboard/services/vapi-services";
import { VapiClient } from "@vapi-ai/server-sdk";
import clientPromise from "../../../../../../../db";
import { ObjectId } from "mongodb";

module.exports = apiHandler({
    GET: getAssistantList
});
async function getAssistantList(req: NextRequest) {


    try {

        const userID:string = req.nextUrl.searchParams.get("userId") as string;
        const db = (await clientPromise!).db();
        const collection = db?.collection("voice-assistance");
        const assistants = await collection?.find({ vapiAssistantId: { $exists: true } }).toArray();

        return { assistants } ;

        // return { message : "got the message"};        
    }
    catch (error: any) {
        return { error: error.message };
    }

}