
import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "../../../../../../_helpers/server/api/api-handler";
import { generateAndGetToken } from "../../../../dashboard/services/vapi-services";
import clientPromise from "../../../../../../../db";
import { ObjectId } from "mongodb";


module.exports = apiHandler({

    POST: addFreeVapiNumberWithAssistantAndAreaCode,
    //   GET: getImportedTwilioDataFromDB,
    //   PUT: updateNumberWithAssistant, //dashboard/api/assistant
    //   DELETE: deleteSingleAssistant, //dashboard/api/assistant
});


async function addFreeVapiNumberWithAssistantAndAreaCode(req: NextRequest) {
    try {

        const data: { assistantId: string; areaCode: string, userId: string } = await req.json();

        const token = await generateAndGetToken();

        // Create Phone Number (POST /phone-number)
        const response = await fetch("https://api.vapi.ai/phone-number", {
            method: "POST",
            headers: {
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "provider": "vapi",
                "assistantId": data.assistantId,
                "numberDesiredAreaCode": data.areaCode
            }),
        });

        const body = await response.json();

        const db = (await clientPromise!).db();

        const voiceAssistantCollection = db?.collection(
            "voice-assistance-phone-numbers"
        );

        const result = await voiceAssistantCollection?.insertOne({
            vapi: body,
            userId: new ObjectId(data.userId),
        });

        console.log(body);
        console.log("db result ", result);

        return { message: "Data received successfully" };

    }
    catch (error: any) {
        console.error("Error parsing request body:", error);
        if (error.body) {
            return { message: error.body.message };
        }
        return { message: error };
    }

}