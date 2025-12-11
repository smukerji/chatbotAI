
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
    console.log("=== API Route Called ===");

    try {
        const data: { assistantId: string; areaCode: string, userId: string } = await req.json();

        // Validate input
        if (!data.assistantId || !data.areaCode || !data.userId) {
            console.error("Missing required fields");
            return {
                message: "Missing required fields: assistantId, areaCode, or userId",
                statusCode: 400
            };
        }

        // Connect to database FIRST
        const db = (await clientPromise!).db();
        const voiceAssistantCollection = db?.collection(
            "voice-assistance-phone-numbers"
        );

        // Now check if user already has 2 free VAPI numbers (not Twilio numbers)
        const existingVapiNumbersCount = await voiceAssistantCollection?.countDocuments({
            userId: new ObjectId(data.userId),
            "vapi.provider": "vapi"  // Only count VAPI numbers, not Twilio
        });

        // Only prevent if user already has 2 VAPI numbers
        if (existingVapiNumbersCount >= 2) {

            // Return error 
            return {
                message: "You have reached the maximum limit of 2 free VAPI numbers. Please delete an existing VAPI number before adding a new one.",
                error: "LIMIT_REACHED",
                currentCount: existingVapiNumbersCount,
                statusCode: 400
            };
        }

        const token = await generateAndGetToken();

        const requestBody = {
            "provider": "vapi",
            "assistantId": data.assistantId,
            "numberDesiredAreaCode": data.areaCode
        };

        // Create Phone Number (POST /phone-number)
        const response = await fetch("https://api.vapi.ai/phone-number", {
            method: "POST",
            headers: {
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestBody),
        });

        // Get response text first to handle both JSON and non-JSON responses
        const responseText = await response.text();

        let body;
        try {
            body = JSON.parse(responseText);
            console.log("Parsed Response Body:", JSON.stringify(body, null, 2));
        } catch (parseError) {
            console.error("Failed to parse response as JSON:", parseError);
            body = { raw: responseText };
        }

        // Check if VAPI API request was successful
        if (!response.ok) {
            console.error("VAPI API Error - Status:", response.status);
            console.error("VAPI API Error - Body:", body);

            // Return error in format that apiHandler expects
            return {
                message: body?.message || body?.error || `VAPI API error: ${response.statusText}`,
                error: "VAPI_API_ERROR",
                details: body,
                statusCode: response.status
            };
        }

        // Only insert into DB if VAPI API call was successful
        console.log("VAPI API call successful, inserting into database...");
        await voiceAssistantCollection?.insertOne({
            vapi: body,
            userId: new ObjectId(data.userId),
        });

        return {
            message: "VAPI number created successfully",
            data: body
        };

    } catch (error: any) {
        console.error("=== Caught Error ===");
        console.error("Error Type:", error?.constructor?.name);
        console.error("Error Message:", error?.message);
        console.error("Error Stack:", error?.stack);
        console.error("Full Error:", JSON.stringify(error, null, 2));
        console.error("==================");

        // Handle different error types
        if (error.body) {
            return {
                message: error.body.message || "Unknown error occurred",
                statusCode: 500
            };
        }

        return {
            message: error?.message || "An unexpected error occurred",
            error: error?.toString(),
            statusCode: 500
        };
    }
}