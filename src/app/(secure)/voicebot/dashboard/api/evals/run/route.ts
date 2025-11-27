
import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/db";
import { apiHandler } from "@/app/_helpers/server/api/api-handler";

module.exports = apiHandler({
  POST: createEvalRun,
});

async function createEvalRun(req: NextRequest) {
  try {
    const data = await req.json();
    const { evalId, assistantId, assistantMongoId, userId, eval: evalObj } = data;

    console.log("Received data:", { evalId, assistantId, assistantMongoId, userId });

    if (!assistantId) {
      return { error: "assistantId is required", status: 400 };
    }
    if (!assistantMongoId || !userId) {
      return { error: "assistantMongoId and userId are required", status: 400 };
    }
    if (!evalId && !evalObj) {
      return { error: "evalId or eval object is required", status: 400 };
    }

    const requestBody: any = {
      target: {
        type: "assistant",
        assistantId,
      },
      type: "eval",
    };
    if (evalId) requestBody.evalId = evalId;
    else if (evalObj) requestBody.eval = evalObj;

    const vapiRes = await fetch("https://api.vapi.ai/eval/run", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.VAPI_PRIVATE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const vapiData = await vapiRes.json();
    
    console.log("Vapi response:", vapiData);

    if (!vapiRes.ok) {
      return {
        error: vapiData.error || vapiData.message || "Failed to create eval run",
        status: vapiRes.status,
      };
    }

  
    if (evalId && vapiData.workflowId && vapiData.evalRunId) {
      const newRun = {
        workflowId: vapiData.workflowId,  
        evalRunId: vapiData.evalRunId,    
        status: vapiRes.status || 200,
        createdAt: new Date(),
      };

      console.log("New run object:", newRun);

      const db = (await clientPromise!).db();

      const updateResult = await db.collection("voice-assistance").updateOne(
        {
          _id: new ObjectId(assistantMongoId),
          userId: new ObjectId(userId),
          "evals.evalId": evalId,
        },
        {
          $push: {
            "evals.$.runs": newRun,
          },
        }
      );

      console.log("MongoDB update result:", {
        matchedCount: updateResult.matchedCount,
        modifiedCount: updateResult.modifiedCount
      });

      if (updateResult.matchedCount === 0) {
        console.error("No document matched the query!");
        return {
          error: "Could not find eval to update",
          status: 404
        };
      }
    }

    return {
      message: "Eval run created successfully",
      run: vapiData,
      status: 200,
    };
  } catch (e: any) {
    console.error("Error creating eval run:", e);
    return { error: e.message || "Internal server error", status: 500 };
  }
}