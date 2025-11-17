// app/(secure)/voicebot/dashboard/api/evals/route.ts

import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "../../../../../_helpers/server/api/api-handler";
import { generateAndGetToken } from "../../../dashboard/services/vapi-services";

module.exports = apiHandler({
    GET: getEvalsForAssistant
});

async function getEvalsForAssistant(req: NextRequest) {
    try {
        // Get the assistant ID from the query string
        const assistantId = req.nextUrl.searchParams.get("assistantId") as string;
        if (!assistantId) {
            return NextResponse.json({ error: "Missing assistantId" }, { status: 400 });
        }

        // Get auth token to call Vapi services (your function - ensures server side key usage)
        const token = await generateAndGetToken();

        // Call Vapi's Evals endpoint
        const response = await fetch(
            `https://api.vapi.ai/eval?assistantId=${assistantId}`,
            {
                method: "GET",
                headers: {
                    Authorization: "Bearer " + token,
                    "Content-Type": "application/json"
                }
            }
        );
        const data = await response.json();

        // Send the Vapi response directly or map as needed
        return NextResponse.json({ evals: data.items ?? [], vapiResponse: data });
    }  catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === "string"
        ? error
        : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
}

}
