

import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "../../../../../../_helpers/server/api/api-handler";
import { generateAndGetToken } from "../../../../dashboard/services/vapi-services";
import clientPromise from "../../../../../../../db";
import { ObjectId } from "mongodb";

module.exports = apiHandler({
  DELETE: deleteEval,
});



/**
 * DELETE /api/evals/delete?evalId=xxx&assistantId=xxx
 */
async function deleteEval(req: NextRequest) {
  try {
    const evalId = req.nextUrl.searchParams.get("evalId") as string;
    const assistantId = req.nextUrl.searchParams.get("assistantId") as string;

    if (!evalId || !assistantId) {
      return NextResponse.json(
        { error: "Eval ID and Assistant ID are required" },
        { status: 400 }
      );
    }

    // Get JWT token for Vapi
    const token = process.env.VAPI_PRIVATE_KEY

    // Delete from Vapi
    const vapiResponse = await fetch(`https://api.vapi.ai/eval/${evalId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!vapiResponse.ok) {
      const error = await vapiResponse.json();
      console.error("Vapi delete error:", error);
      return NextResponse.json(
        {
          error: error.message || "Failed to delete evaluation from Vapi",
        },
        { status: vapiResponse.status }
      );
    }

    // Remove eval ID from assistant's evals_id array in DB
    const db = (await clientPromise!).db();
    const evalCollection = db.collection("voice-assistance");
    const deleteResult = await evalCollection.updateOne(
    { _id: new ObjectId(assistantId) },
    { $pull: { evals: { evalId } }, $set: { updatedAt: new Date() } }
);
console.log("Deleted result:", deleteResult);

// deleteResult.deletedCount should be 1 if successful

    return NextResponse.json({
      message: "Evaluation deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting eval:", error);
    return NextResponse.json(
      {
        error: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}



