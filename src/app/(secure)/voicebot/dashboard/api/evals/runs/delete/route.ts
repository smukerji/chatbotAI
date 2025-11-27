import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "../../../../../../../_helpers/server/api/api-handler";
import clientPromise from "../../../../../../../../db";
import { ObjectId } from "mongodb";

module.exports = apiHandler({
  DELETE: deleteEvalRun,
});

/**
 * Delete an evaluation run
 * DELETE /api/evals/runs/delete?runId=xxx&assistantId=xxx&userId=xxx&evalId=xxx
 */
async function deleteEvalRun(req: NextRequest) {
  try {
    const runId = req.nextUrl.searchParams.get("runId");
    const assistantMongoId = req.nextUrl.searchParams.get("assistantId");
    const userId = req.nextUrl.searchParams.get("userId");
    const evalId = req.nextUrl.searchParams.get("evalId");

    console.log("Delete run params:", { runId, assistantMongoId, userId, evalId });

    if (!runId || !assistantMongoId || !userId) {
      return { error: "Missing required parameters: runId, assistantId, userId", status: 400 };
    }

    // Get Vapi token
    const token = process.env.VAPI_PRIVATE_KEY

    // Delete from Vapi API
    const vapiRes = await fetch(`https://api.vapi.ai/eval/run/${runId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!vapiRes.ok) {
      const errorData = await vapiRes.json().catch(() => ({}));
      console.error("Vapi delete error:", errorData);
      return {
        error: errorData.error || "Failed to delete run from Vapi",
        status: vapiRes.status,
      };
    }

    console.log("Vapi delete successful");

    //  delete from MongoDB
    const db = (await clientPromise!).db();
    const collection = db.collection("voice-assistance");

    // find the document to see its structure
    const assistant = await collection.findOne({
      _id: new ObjectId(assistantMongoId),
      userId: new ObjectId(userId),
    });

    console.log("Assistant found:", assistant ? "Yes" : "No");
    console.log("Evals array:", assistant?.evals);

    if (!assistant) {
      return { error: "Assistant not found", status: 404 };
    }

    //  If evalId is provided, update specific eval
    if (evalId) {
      const updateResult = await collection.updateOne(
        {
          _id: new ObjectId(assistantMongoId),
          userId: new ObjectId(userId),
        },
        {
          $pull: {
            "evals.$[evalItem].runs": { evalRunId: runId }
          }
        },
        {
          arrayFilters: [
            { "evalItem.evalId": evalId }
          ]
        }
      );

      console.log("Update result (with evalId):", updateResult);

      if (updateResult.modifiedCount === 0) {
        console.warn("No documents modified - run may not exist in DB");
      }
    } else {
      // Without evalId, search all evals for the run
      const updateResult = await collection.updateOne(
        {
          _id: new ObjectId(assistantMongoId),
          userId: new ObjectId(userId),
        },
        {
          $pull: {
            "evals.$[].runs": { evalRunId: runId }
          }
        }
      );

      console.log("Update result (without evalId):", updateResult);

      if (updateResult.modifiedCount === 0) {
        console.warn("No documents modified - run may not exist in DB");
      }
    }

    return {
      message: "Run deleted successfully",
      status: 200,
    };
  } catch (e: any) {
    console.error("Error deleting run:", e);
    return { 
      error: e.message || "Internal server error", 
      status: 500 
    };
  }
}