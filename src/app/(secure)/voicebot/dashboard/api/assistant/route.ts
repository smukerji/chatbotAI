import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "../../../../../_helpers/server/api/api-handler";
import clientPromise from "../../../../../../db";
import { ObjectId } from "mongodb";

module.exports = apiHandler({
    GET: getAssistantList,//dashboard/api/assistant
});

async function getAssistantList(req: NextRequest) {


    try {

        const userID:string = req.nextUrl.searchParams.get("userId") as string;
        const db = (await clientPromise!).db();
        const collection = db?.collection("voice-assistance");
        // const assistants = await collection?.find({ userId: new ObjectId(userID) }).toArray();
        const assistants = await collection?.aggregate([
            { $match: { userId: new ObjectId(userID) } },
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
