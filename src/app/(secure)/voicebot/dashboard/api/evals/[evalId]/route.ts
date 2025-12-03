import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/db";

/**
 * GET /api/evals/[evalId]
 * Fetches a single evaluation by ID from VAPI and merges with local DB metadata
 */
export async function GET(
  req: NextRequest,
  context: { params: { evalId: string } }
) {
  try {
    console.log("Context received:", context);
    console.log("Params:", context?.params);
    
    const evalId = context?.params?.evalId;

    if (!evalId) {
      console.error("Missing evalId from params");
      return NextResponse.json(
        { error: "Missing evalId" },
        { status: 400 }
      );
    }

    console.log("Fetching eval from VAPI:", evalId);

    // Fetch eval from VAPI
    const vapiRes = await fetch(`https://api.vapi.ai/eval/${evalId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.VAPI_PRIVATE_KEY}`,
        "Content-Type": "application/json"
      },
    });

    if (!vapiRes.ok) {
      const errorData = await vapiRes.json();
      console.error("VAPI Error:", errorData);
      return NextResponse.json(
        { error: errorData.error || errorData.message || "Failed to fetch eval from VAPI" },
        { status: vapiRes.status }
      );
    }

    const vapiData = await vapiRes.json();
    console.log("VAPI Eval Data:", vapiData);

    try {
      const db = (await clientPromise!).db();
      
      // Find the assistant that has this eval
      const assistant = await db.collection("voice-assistance").findOne({
        "evals.evalId": evalId
      });

      if (assistant) {
        const localEval = assistant.evals.find((e: any) => e.evalId === evalId);
        
        // Merge local metadata with VAPI data
        const mergedData = {
          ...vapiData,
          localName: localEval?.name,
          localDescription: localEval?.description,
          localCreatedAt: localEval?.createdAt,
          assistantMongoId: assistant._id.toString(),
          vapiAssistantId: assistant.vapiAssistantId,
        };

        return NextResponse.json({ eval: mergedData }, { status: 200 });
      }
    } catch (dbError) {
      console.warn("Could not fetch local metadata:", dbError);
      // Continue without local metadata
    }

    // Return VAPI data even if local metadata not found
    return NextResponse.json({ eval: vapiData }, { status: 200 });

  } catch (e: any) {
    console.error("Error in GET handler:", e);
    return NextResponse.json(
      { error: e.message || "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/evals/[evalId]
 * Updates an evaluation in VAPI and local DB
 */
export async function PATCH(
  req: NextRequest,
  context: { params: { evalId: string } }
) {
  try {
    console.log("PATCH Context received:", context);
    console.log("PATCH Params:", context?.params);
    
    const evalId = context?.params?.evalId;

    if (!evalId) {
      console.error("Missing evalId from params");
      return NextResponse.json(
        { error: "Missing evalId" },
        { status: 400 }
      );
    }

    const data = await req.json();
    const {
      evalName,
      evalDesc,
      assistantMongoId,
      userId,
      vapiAssistantId,
      turns,
    } = data;

    console.log("Updating eval:", evalId);
    console.log("Received turns:", JSON.stringify(turns, null, 2));

    if (!evalName || !vapiAssistantId || !assistantMongoId || !userId || !Array.isArray(turns)) {
      return NextResponse.json(
        { error: "Missing required fields!" },
        { status: 400 }
      );
    }

    // Transform turns to VAPI format
    const vapiMessages = turns.map((t: any) => {
      const role = t.role || t.type;

      // System messages
      if (role === "system") {
        return {
          role: "system",
          content: t.message || t.content || "",
        };
      }

      // User messages
      if (role === "user") {
        return {
          role: "user",
          content: t.message || t.content || "",
        };
      }

      // Tool response messages
      if (role === "tool" || t.type === "tool-response") {
        return {
          role: "tool",
          content: t.message || t.content || "",
        };
      }

      // Assistant messages
      if (role === "assistant") {
        // Check if this is an evaluation checkpoint
        if (t.tool_calls && t.tool_calls.length > 0) {
          const judgePlan: any = {
            type: "exact", 
          };

          // Only add content if it exists and is not empty
          if (t.message && t.message.trim()) {
            judgePlan.content = t.message.trim();
          }

          // Add tool call validation
          judgePlan.toolCalls = t.tool_calls.map((tc: any) => {
            let args = tc.function.arguments;
            if (typeof args === 'string') {
              try {
                args = JSON.parse(args);
              } catch (e) {
                console.error("Failed to parse tool call arguments:", args);
                args = {};
              }
            }

            return {
              name: tc.function.name,
              arguments: args,
            };
          });

          return {
            role: "assistant",
            judgePlan: judgePlan,
          };
        } else {
          // Regular mock assistant message
          return {
            role: "assistant",
            content: t.message || t.content || "",
          };
        }
      }

      // Fallback
      return {
        role: "assistant",
        content: t.message || t.content || "",
      };
    });

    console.log("Transformed messages for VAPI:", JSON.stringify(vapiMessages, null, 2));

    // Build VAPI payload 
    const vapiPayload = {
      name: evalName,
      description: evalDesc || "",
      messages: vapiMessages,
    };

    console.log("Sending to VAPI PATCH:", JSON.stringify(vapiPayload, null, 2));

    // Update eval in VAPI
    const vapiRes = await fetch(`https://api.vapi.ai/eval/${evalId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${process.env.VAPI_PRIVATE_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(vapiPayload),
    });

    const vapiData = await vapiRes.json();
    
    if (!vapiRes.ok) {
      console.error("VAPI Error Response:", vapiData);
      return NextResponse.json(
        {
          error: vapiData.error || vapiData.message || "VAPI update failed",
          details: vapiData,
        },
        { status: vapiRes.status }
      );
    }

    console.log("VAPI Success Response:", vapiData);

    // Update local DB metadata
    try {
      const db = (await clientPromise!).db();
      
      await db.collection("voice-assistance").updateOne(
        {
          _id: new ObjectId(assistantMongoId),
          userId: new ObjectId(userId),
          "evals.evalId": evalId
        },
        {
          $set: {
            "evals.$.name": evalName,
            "evals.$.description": evalDesc,
            "evals.$.vapiAssistantId": vapiAssistantId,
            "evals.$.updatedAt": new Date(),
          }
        }
      );

      console.log("Local DB updated successfully");
    } catch (dbError) {
      console.error("DB update error:", dbError);
    }

    return NextResponse.json(
      {
        message: "Evaluation updated successfully",
        eval: vapiData,
      },
      { status: 200 }
    );

  } catch (e: any) {
    console.error("Error in PATCH handler:", e);
    return NextResponse.json(
      { error: e.message || "Internal server error" },
      { status: 500 }
    );
  }
}