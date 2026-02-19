import { NextRequest, NextResponse } from "next/server";
import clientPromise from "../../../../../../../db";
import fs from "fs";

/**
 * Vapi Webhook: end-of-call-report
 * 
 * This endpoint is triggered by Vapi's webhook when a call ends.
 * It receives the end-of-call-report payload, extracts the assistantId and cost,
 * looks up the userId from the voice-assistance collection,
 * and deducts the call cost (with 30% margin) from the user's voicebot credits.
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // log the request body to a file
        fs.writeFileSync("vapi-end-of-call-request.json", JSON.stringify(body, null, 2));

        // The webhook payload has the structure: { message: { ... } }
        const messageData = body?.message || body;

        // only process end-of-call-report type, ignore other webhook types
        if (messageData?.type !== "end-of-call-report") {
            return NextResponse.json({ message: "Ignored, not an end-of-call-report" });
        }

        // extract the assistantId from the call object
        const assistantId: string = messageData?.call?.assistantId;

        if (!assistantId) {
            console.error("Vapi end-of-call webhook: No assistantId found in payload");
            return NextResponse.json(
                { message: "No assistantId found in payload" },
                { status: 400 }
            );
        }

        // extract the cost directly from the webhook payload
        const callCost: number = messageData?.cost || 0;
        const callId: string = messageData?.call?.id || "";

        if (callCost === 0) {
            console.warn("Vapi end-of-call webhook: Call cost is 0, skipping credit deduction");
            return NextResponse.json({ message: "Call cost is 0, no deduction needed" });
        }

        // prepare db connection
        const db = (await clientPromise!).db();

        // look up the userId from voice-assistance collection using vapiAssistantId
        const voiceAssistanceCollection = db?.collection("voice-assistance");
        const voiceAssistantRecord = await voiceAssistanceCollection?.findOne({
            vapiAssistantId: assistantId,
        });

        if (!voiceAssistantRecord) {
            console.error(`Vapi end-of-call webhook: No voice-assistance record found for vapiAssistantId: ${assistantId}`);
            return NextResponse.json(
                { message: "No voice assistant record found for this assistantId" },
                { status: 404 }
            );
        }

        // the userId in voice-assistance is stored as an ObjectId
        const userId: string = voiceAssistantRecord.userId.toString();

        // get the user's voice credits from user-details collection
        const usersDetailsCollection = db?.collection("user-details");
        const userRecord = await usersDetailsCollection?.findOne({ userId: userId });

        if (!userRecord) {
            console.error(`Vapi end-of-call webhook: No user-details record found for userId: ${userId}`);
            return NextResponse.json(
                { message: "No user details found for this user" },
                { status: 404 }
            );
        }

        // if the user has voicebot credits
        if (userRecord.voicebotDetails && userRecord.voicebotDetails.credits) {
            // deduct the cost from the user's voice credits (adding 30% margin to the cost)
            const costWithMargin = callCost * 1.3;
            userRecord.voicebotDetails.credits -= costWithMargin;

            // update the user's voice credits
            await usersDetailsCollection?.updateOne(
                { userId: userId },
                { $set: { voicebotDetails: userRecord.voicebotDetails } }
            );

            // log the call cost in voice-call-costs-logs collection
            const voiceCallCostLogsTable = db?.collection("voice-call-costs-logs");

            const totalCallCostLogs = {
                ...messageData,
                callId: callId,
                assistantId: assistantId,
                torriMarginCost: costWithMargin,
                userId: userId,
                source: "vapi-webhook",
                createdAt: new Date(),
            };

            // if the record already exists, don't insert again (avoid duplicates)
            const existingLog = await voiceCallCostLogsTable?.findOne({ callId: callId });
            if (!existingLog) {
                await voiceCallCostLogsTable?.insertOne(totalCallCostLogs);
            }

            const updatedCreditsRecord = await usersDetailsCollection?.findOne({ userId: userId });

            console.log(`Vapi end-of-call webhook: Credits updated for userId: ${userId}, deducted: ${costWithMargin}, remaining: ${updatedCreditsRecord?.voicebotDetails?.credits}`);

            return NextResponse.json({
                message: "credits updated",
                data: updatedCreditsRecord?.voicebotDetails?.credits,
            });
        } else {
            console.warn(`Vapi end-of-call webhook: No credits found for userId: ${userId}`);
            return NextResponse.json({ message: "No credits found for this user" });
        }
    } catch (error: any) {
        console.error("Vapi end-of-call webhook error:", error);
        return NextResponse.json(
            { message: error?.message || "Internal server error" },
            { status: 500 }
        );
    }
}
