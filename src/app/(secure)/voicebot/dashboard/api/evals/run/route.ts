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
    const { evalId,evalName, assistantId, assistantMongoId, userId, assistantVariables, eval: evalObj } = data;

    console.log("Received data:", { evalId,evalName, assistantId, assistantMongoId, userId, assistantVariables });

    if (!assistantId) {
      return { error: "assistantId is required", status: 400 };
    }
    if (!assistantMongoId || !userId) {
      return { error: "assistantMongoId and userId are required", status: 400 };
    }
    if (!evalId && !evalObj) {
      return { error: "evalId or eval object is required", status: 400 };
    }

    // Build request body for Vapi
    const requestBody: any = {
      target: {
        type: "assistant",
        assistantId,
      },
      type: "eval",
    };

    // If variables exist, fetch eval from Vapi and process them
    if (assistantVariables && Object.keys(assistantVariables).length > 0) {
      console.log("Variables detected, fetching eval from Vapi...");
      
      let evalData = evalObj;
      
      // Fetch from Vapi if we only have evalId
      if (evalId && !evalObj) {
        const vapiEvalResponse = await fetch(`https://api.vapi.ai/eval/${evalId}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${process.env.VAPI_PRIVATE_KEY}`,
            "Content-Type": "application/json",
          },
        });

        if (!vapiEvalResponse.ok) {
          const errorData = await vapiEvalResponse.json();
          console.error("Failed to fetch eval from Vapi:", errorData);
          return { 
            error: errorData.error || "Failed to fetch eval from Vapi", 
            status: vapiEvalResponse.status 
          };
        }

        evalData = await vapiEvalResponse.json();
        console.log("Fetched eval from Vapi - messages count:", evalData.messages?.length || 0);
      }

      if (!evalData) {
        return { error: "Eval data is missing", status: 400 };
      }

      // Process variables in the eval
      console.log("Processing variables in eval...");
      const processedEval = processVariablesInEval(evalData, assistantVariables);
      console.log("Processed eval - messages count:", processedEval.messages?.length || 0);
      
      // Send the processed eval object
      requestBody.eval = cleanEvalForVapi(processedEval);
      console.log("Cleaned eval for Vapi - messages count:", requestBody.eval.messages?.length || 0);
    } else {
      // No variables, just send evalId
      if (evalId) {
        requestBody.evalId = evalId;
        console.log("No variables, sending evalId:", evalId);
      } else if (evalObj) {
        requestBody.eval = cleanEvalForVapi(evalObj);
        console.log("No variables, sending eval object");
      }
    }

    console.log("Sending to Vapi:", JSON.stringify(requestBody, null, 2));

    const vapiRes = await fetch("https://api.vapi.ai/eval/run", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.VAPI_PRIVATE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const vapiData = await vapiRes.json();
    
    console.log("Vapi response:", JSON.stringify(vapiData, null, 2));

    if (!vapiRes.ok) {
      return {
        error: vapiData.error || vapiData.message || "Failed to create eval run",
        details: vapiData,
        status: vapiRes.status,
      };
    }

    // Store the run in MongoDB
    if (evalId && vapiData.workflowId && vapiData.evalRunId) {
      const newRun = {
        workflowId: vapiData.workflowId,  
        evalRunId: vapiData.evalRunId,   
        evalName: evalName || "Unknown", 
        status: vapiRes.status || 200,
        createdAt: new Date(),
      };

      console.log("Storing run in MongoDB:", newRun);

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
        console.warn("Could not find eval in MongoDB to update");
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

/**
 * Clean eval object to only include fields Vapi expects
 */
function cleanEvalForVapi(evalData: any): any {
  const cleanEval: any = {
    type: "chat.mockConversation", // Required by Vapi
    messages: evalData.messages || [],
  };

  // Only include optional fields if they exist
  if (evalData.name) {
    cleanEval.name = evalData.name;
  }
  if (evalData.description) {
    cleanEval.description = evalData.description;
  }

  console.log("cleanEvalForVapi - Input messages:", evalData.messages?.length || 0);
  console.log("cleanEvalForVapi - Output messages:", cleanEval.messages.length);
  
  return cleanEval;
}

/**
 * Replace variables in eval messages with actual values
 */
function processVariablesInEval(evalData: any, variables: Record<string, string>): any {
  // Deep clone the eval data to avoid mutating the original
  const processedEval = JSON.parse(JSON.stringify(evalData));

  // Function to replace variables in a string
  const replaceVariables = (text: string): string => {
    if (typeof text !== 'string') return text;
    
    let result = text;
    
    // Replace variables in format: {{variable_name}} or {variable_name}
    Object.keys(variables).forEach((key) => {
      const cleanKey = key.replace(/^\{\{|\}\}$/g, '').trim(); // Remove {{ }} if present
      const value = variables[key];
      
      // Replace both {{key}} and {key} formats
      result = result.replace(new RegExp(`\\{\\{\\s*${cleanKey}\\s*\\}\\}`, 'g'), value);
      result = result.replace(new RegExp(`\\{\\s*${cleanKey}\\s*\\}`, 'g'), value);
    });
    
    return result;
  };

  // Process messages if they exist
  if (processedEval.messages && Array.isArray(processedEval.messages)) {
    console.log("Processing", processedEval.messages.length, "messages for variable replacement");
    
    processedEval.messages = processedEval.messages.map((msg: any, index: number) => {
      // Handle both 'message' and 'content' fields
      if (msg.message) {
        const original = msg.message;
        msg.message = replaceVariables(msg.message);
        if (original !== msg.message) {
          console.log(`Replaced variables in message ${index}:`, { original, new: msg.message });
        }
      }
      if (msg.content) {
        const original = msg.content;
        msg.content = replaceVariables(msg.content);
        if (original !== msg.content) {
          console.log(`Replaced variables in content ${index}:`, { original, new: msg.content });
        }
      }
      
      // Process tool call arguments if they exist
      if (msg.tool_calls && Array.isArray(msg.tool_calls)) {
        msg.tool_calls = msg.tool_calls.map((toolCall: any) => {
          if (toolCall.function && toolCall.function.arguments) {
            try {
              const args = typeof toolCall.function.arguments === 'string' 
                ? JSON.parse(toolCall.function.arguments) 
                : toolCall.function.arguments;
              
              const processedArgs: any = {};
              Object.keys(args).forEach((argKey) => {
                processedArgs[argKey] = replaceVariables(String(args[argKey]));
              });
              
              toolCall.function.arguments = JSON.stringify(processedArgs);
              console.log(`Processed tool call arguments:`, processedArgs);
            } catch (e) {
              console.error("Error processing tool call arguments:", e);
            }
          }
          return toolCall;
        });
      }
      
      return msg;
    });
  } else {
    console.warn("No messages array found in eval data");
  }

  // Process description if it exists
  if (processedEval.description) {
    processedEval.description = replaceVariables(processedEval.description);
  }

  // Process name if it exists
  if (processedEval.name) {
    processedEval.name = replaceVariables(processedEval.name);
  }

  return processedEval;
}