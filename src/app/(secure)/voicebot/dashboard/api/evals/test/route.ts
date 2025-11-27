
import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "../../../../../../_helpers/server/api/api-handler";

module.exports = apiHandler({
  POST: testEval,
});

/**
 * Test an evaluation without saving to database
 * POST /api/evals/test
 */
async function testEval(req: NextRequest) {
  try {
    const {
      evalName,
      evalDesc,
      vapiAssistantId,
      turns,
    } = await req.json();

    console.log("Test eval request:", { evalName, vapiAssistantId, turnsCount: turns?.length });

    // Validate required fields
    if (!vapiAssistantId || !evalName || !turns || turns.length === 0) {
      return { error: "Missing required fields", status: 400 };
    }

    // Get Vapi token
    const token = process.env.VAPI_PRIVATE_KEY

const vapiMessages = turns.map((turn: any) => {
  const message: any = {
    role: turn.role,
    content: turn.message || "",
  };

  // Transform tool calls to correct format
  if (turn.tool_calls && turn.tool_calls.length > 0) {
    message.toolCalls = turn.tool_calls.map((tc: any) => {
      // Parse arguments if it's a string
      let args = tc.function?.arguments || tc.arguments;
      if (typeof args === 'string') {
        try {
          args = JSON.parse(args);
        } catch (e) {
          args = {};
        }
      }

      return {
        name: tc.function?.name || tc.name,
        arguments: args,
      };
    });
  }

 
  if (turn.judgePlan) {
    message.judgePlan = turn.judgePlan;
  }

  return message;
});

console.log("Transformed messages for VAPI:", JSON.stringify(vapiMessages, null, 2));

    console.log("Creating eval in Vapi with messages:", vapiMessages.length);


    const createEvalPayload = {
      name: `${evalName} (Test)`,
      description: evalDesc || "Test run",
      type: "chat.mockConversation",
      messages: vapiMessages,
    };

    console.log("Create eval payload:", JSON.stringify(createEvalPayload, null, 2));

    const createEvalResponse = await fetch("https://api.vapi.ai/eval", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(createEvalPayload),
    });

    if (!createEvalResponse.ok) {
      const error = await createEvalResponse.json();
      console.error("Failed to create eval:", error);
      return {
        error: error.message || error.errors || "Failed to create evaluation",
        status: createEvalResponse.status,
      };
    }

    const tempEval = await createEvalResponse.json();
    console.log("Eval created:", tempEval.id);


const runEvalResponse = await fetch("https://api.vapi.ai/eval/run", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    evalId: tempEval.id,
    type: "eval",
    target: {     
      type: "assistant",
      assistantId: vapiAssistantId,
    },
  }),
});

    if (!runEvalResponse.ok) {
      const error = await runEvalResponse.json();
      console.error("Failed to run eval:", error);
      
      // Clean up temp eval
      await fetch(`https://api.vapi.ai/eval/${tempEval.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});

      return {
        error: error.message || error.errors || "Failed to run evaluation",
        status: runEvalResponse.status,
      };
    }

   const runResult = await runEvalResponse.json();
console.log("Full run result:", runResult); 


const runId = runResult.evalRunId || runResult.id;
console.log("Run ID:", runId);

if (!runId) {
  console.error("No run ID in response:", runResult);
  return {
    error: "Failed to get run ID from response",
    status: 500,
  };
}


let runDetails = null;
let attempts = 0;
const maxAttempts = 30; 

while (attempts < maxAttempts) {
  await new Promise(resolve => setTimeout(resolve, 1000)); 

  const statusResponse = await fetch(
    `https://api.vapi.ai/eval/run/${runId}`, 
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (statusResponse.ok) {
    runDetails = await statusResponse.json();
    console.log(`Attempt ${attempts + 1}: Status =`, runDetails.status);
    
    // Check if run is complete
    if (runDetails.status === "complete" || runDetails.status === "completed" || runDetails.endedAt) {
      console.log("Run completed after", attempts + 1, "seconds");
      break;
    }

    // Check for failure
    if (runDetails.status === "failed" || runDetails.status === "error") {
      console.error("Run failed:", runDetails);
      break;
    }
  } else {
    console.warn("Failed to fetch run status:", statusResponse.status);
  }

  attempts++;
}

if (attempts >= maxAttempts) {
  console.warn("Run timed out after", maxAttempts, "seconds");
}

console.log("Final run details:", runDetails);

// Extract conversation from results
const messages = runDetails?.results?.[0]?.messages || runDetails?.messages || [];
const conversation = messages
  .filter((msg: any) => msg.role === 'user' || msg.role === 'assistant')
  .map((msg: any) => ({
    role: msg.role,
    content: msg.content || msg.message || '',
  }));

console.log("Extracted conversation:", conversation.length, "messages");

// Clean up: Delete temporary eval and run
console.log("Cleaning up temp eval and run...");
await Promise.all([
  fetch(`https://api.vapi.ai/eval/run/${runId}`, { 
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  }).catch(err => console.warn("Failed to delete run:", err.message)),
  fetch(`https://api.vapi.ai/eval/${tempEval.id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  }).catch(err => console.warn("Failed to delete eval:", err.message)),
]);

return {
  message: "Test completed successfully",
  conversation,
  runDetails: runDetails || {},
  status: 200,
};

  } catch (error: any) {
    console.error("Test eval error:", error);
    return {
      error: error.message || "Internal server error",
      status: 500,
    };
  }
}