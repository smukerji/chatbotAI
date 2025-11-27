import { NextRequest } from "next/server";
import { apiHandler } from "@/app/_helpers/server/api/api-handler";
import clientPromise from "@/db";
import { ObjectId } from "mongodb";

module.exports = apiHandler({
  GET: listEvalRuns,
});

async function listEvalRuns(req: NextRequest) {
  try {
    // Extract assistantId and userId from query params
    const assistantMongoId = req.nextUrl.searchParams.get("assistantId") as string;
    const userId = req.nextUrl.searchParams.get("userId") as string;
    if (!assistantMongoId || !userId) {
      return { error: "Missing assistantId or userId", status: 400 };
    }

    // Fetch local assistant from DB to get vapiAssistantId
    const db = (await clientPromise!).db();
    const assistant = await db.collection("voice-assistance").findOne({
      _id: new ObjectId(assistantMongoId),
      userId: new ObjectId(userId),
    });
    if (!assistant || !assistant.vapiAssistantId) {
      return { error: "Assistant not found", status: 404 };
    }
    const vapiAssistantId = assistant.vapiAssistantId;

    // Fetch all runs from Vapi
    const vapiRes = await fetch("https://api.vapi.ai/eval/run", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.VAPI_PRIVATE_KEY}`,
        "Content-Type": "application/json",
      }
    });
    const vapiData = await vapiRes.json();
    if (!vapiRes.ok) {
      return {
        error: vapiData.error || vapiData.message || "Failed to list eval runs",
        status: vapiRes.status,
      };
    }

    // Filter runs belonging only to this assistant
 const filteredRuns = (vapiData.results || []).filter(
  (run: any) => run.target && run.target.assistantId === vapiAssistantId
);


    return {
      runs: filteredRuns,
      meta: vapiData.metadata || {},
      status: 200,
    };
  } catch (e: any) {
    return { error: e.message || "Internal server error", status: 500 };
  }
}
