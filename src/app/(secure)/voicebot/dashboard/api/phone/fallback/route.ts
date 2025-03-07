import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "../../../../../../_helpers/server/api/api-handler";
import { generateAndGetToken } from "../../../../dashboard/services/vapi-services";
import { VapiClient } from "@vapi-ai/server-sdk";
import clientPromise from "../../../../../../../db";
import { ObjectId } from "mongodb";
//-> api/phone/fallback
module.exports = apiHandler({
    // GET: getAssistantList,//dashboard/api/assistant
    // DELETE:deleteSingleAssistant//dashboard/api/assistant
    // POST: importNumberToTwilio,
    // GET: getImportedTwilioDataFromDB,
    PUT: updateAssistantPhoneFallback,//
    // DELETE: deleteSingleAssistant//dashboard/api/assistant
});

type BodyRequestInput = {
    fallbackDestination: {
        type: string,
        number: string
    },
    twilioId?: string
}

async function updateAssistantPhoneFallback(req: NextRequest) {
    try {

        const data : BodyRequestInput = await req.json();
        const token = await generateAndGetToken();

        //read the twilio data from db
        const db = (await clientPromise!).db();
        const voiceAssistantCollection = db?.collection("voice-assistance-phone-numbers");
        const recordResult = await voiceAssistantCollection?.findOne({ "twilio.id": data.twilioId });
        if (recordResult) {
            const twilioId = recordResult.twilio.id;
            delete data.twilioId;

            //update the record with assistant id
            const response = await fetch(`https://api.vapi.ai/phone-number/${twilioId}`, {
                method: "PATCH",
                headers: {
                    "Authorization": "Bearer " + token,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    ...data
                }),
            });

            const bodyResponse = await response.json();

            console.log('Response from VAPI:', bodyResponse);

            await voiceAssistantCollection?.updateOne({ "twilio.id": twilioId}, { $set: { fallbackNumber: data.fallbackDestination } });

            return { message: "assistant bind with number", data: recordResult };
        }


        return { message: "Twilio record not found!" };
    }
    catch (error: any) {
        console.error('Error parsing request body:', error);
        return { message: error };
    }
}