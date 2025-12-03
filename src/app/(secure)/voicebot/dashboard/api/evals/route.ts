
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/db";
import { apiHandler } from "@/app/_helpers/server/api/api-handler";
import { localeData } from "moment";

module.exports = apiHandler({
    POST: createEval,
    GET: getEvalsList,
});

async function createEval(req: NextRequest) {
    try {
        const data = await req.json();
        const {
            evalName,
            evalDesc,
            assistantMongoId,
            userId,
            vapiAssistantId,
            turns,
        } = data;

        console.log("Received turns from frontend:", JSON.stringify(turns, null, 2));

        if (!evalName || !vapiAssistantId || !assistantMongoId || !userId || !Array.isArray(turns)) {
            return { error: "Missing required fields!", status: 400 };
        }

        // Convert to VAPI's eval message format
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
                // Check if this is an evaluation checkpoint (has judgePlan)
                if (t.judgePlan) {
                    console.log("Processing judgePlan:", JSON.stringify(t.judgePlan, null, 2));
                    
                    const judgePlan: any = {
                        type: t.judgePlan.type || "exact",
                    };

                    // EXACT approach
                    if (judgePlan.type === "exact") {
                        if (t.judgePlan.content && t.judgePlan.content.trim() !== "") {
                            judgePlan.content = t.judgePlan.content.trim();
                        }
                    }

                    // REGEX approach - pattern goes in 'content' field
                    else if (judgePlan.type === "regex") {
                        console.log("Regex pattern received:", t.judgePlan.regexPattern);
                        if (t.judgePlan.regexPattern && t.judgePlan.regexPattern.trim() !== "") {
                            judgePlan.content = t.judgePlan.regexPattern.trim(); // Use 'content', not 'regexPattern'
                            console.log("Setting judgePlan.content to:", judgePlan.content);
                        } else {
                            console.log("WARNING: No regex pattern provided!");
                        }
                    }

                    // LLM-as-a-judge approach
                    else if (judgePlan.type === "llm-as-a-judge") {
                        if (t.judgePlan.passCriteria && t.judgePlan.passCriteria.trim() !== "") {
                            judgePlan.passCriteria = t.judgePlan.passCriteria.trim();
                        }
                        if (t.judgePlan.failCriteria && t.judgePlan.failCriteria.trim() !== "") {
                            judgePlan.failCriteria = t.judgePlan.failCriteria.trim();
                        }
                        if (t.judgePlan.includeConversationContext !== undefined) {
                            judgePlan.includeConversationContext = t.judgePlan.includeConversationContext;
                        }
                        if (t.judgePlan.customPrompt && t.judgePlan.customPrompt.trim() !== "") {
                            judgePlan.customPrompt = t.judgePlan.customPrompt.trim();
                        }
                    }

                    // Add tool call validation if present (for all evaluation types)
                    if (t.judgePlan.toolCalls && t.judgePlan.toolCalls.length > 0) {
                        judgePlan.toolCalls = t.judgePlan.toolCalls.map((tc: any) => {
                            return {
                                name: tc.name,
                                arguments: tc.arguments,
                            };
                        });
                    }

                    console.log("Final judgePlan being sent to VAPI:", JSON.stringify(judgePlan, null, 2));

                    return {
                        role: "assistant",
                        judgePlan: judgePlan,
                    };
                }
                // Check if this is a mock message with tool calls
                else if (t.tool_calls && t.tool_calls.length > 0) {
                    const message: any = {
                        role: "assistant",
                        content: t.message || t.content || "",
                    };

                    // Add tool calls for mock mode
                    message.tool_calls = t.tool_calls.map((tc: any) => {
                        let args = tc.function.arguments;
                        if (typeof args === 'string') {
                            args = JSON.parse(args);
                        }

                        return {
                            type: "function",
                            function: {
                                name: tc.function.name,
                                arguments: args,
                            },
                        };
                    });

                    return message;
                }
                // Regular mock assistant message without tool calls
                else {
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
            type: "chat.mockConversation",
            name: evalName,
            description: evalDesc,
            messages: vapiMessages,
        };

        console.log("Sending to VAPI:", JSON.stringify(vapiPayload, null, 2));

        const vapiRes = await fetch("https://api.vapi.ai/eval", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.VAPI_PRIVATE_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(vapiPayload),
        });

        const vapiData = await vapiRes.json();

        if (!vapiRes.ok) {
            console.error("VAPI Error Response:", vapiData);
            return {
                error: vapiData.error || vapiData.message || "Vapi eval error",
                details: vapiData,
                status: vapiRes.status
            };
        }

        console.log("VAPI Success Response:", vapiData);

        // Store the eval id in your DB
        const db = (await clientPromise!).db();
        await db.collection("voice-assistance").updateOne(
            {
                _id: new ObjectId(assistantMongoId),
                userId: new ObjectId(userId),
            },
            {
                $push: {
                    evals: {
                        evalId: vapiData.id,
                        name: evalName,
                        description: evalDesc,
                        vapiAssistantId: vapiAssistantId,
                        createdAt: new Date(),
                        runs: []
                    }
                }
            }
        );

        return {
            message: "Eval created and stored.",
            eval: vapiData,
            status: 201
        };
    } catch (e: any) {
        console.error("Error in createEval:", e);
        return { error: e.message || "Internal server error", status: 500 };
    }
}

async function getEvalsList(req: NextRequest) {
    try {
        const assistantMongoId = req.nextUrl.searchParams.get("assistantId") as string;
        const userId = req.nextUrl.searchParams.get("userId") as string;
        if (!assistantMongoId || !userId) {
            return { error: "Missing assistantId or userId", status: 400 };
        }
        const db = (await clientPromise!).db();
        const assistant = await db.collection("voice-assistance").findOne({
            _id: new ObjectId(assistantMongoId),
            userId: new ObjectId(userId),
        });
        if (!assistant) {
            return { error: "Assistant not found", status: 404 };
        }

        const evalIds = (assistant.evals || []).map((evalItem: any) => evalItem.evalId);

        if (evalIds.length === 0) {
            return {
                evals: [],
                assistant: {
                    name: assistant.assistantName,
                    vapiAssistantId: assistant.vapiAssistantId
                },
                status: 200
            };
        }

        // Fetch detailed eval data from Vapi API
        const vapiRes = await fetch("https://api.vapi.ai/eval", {
            method: "GET",
            headers: {
                Authorization: `Bearer ${process.env.VAPI_PRIVATE_KEY}`,
                "Content-Type": "application/json"
            },
        });

        if (!vapiRes.ok) {
            const errorData = await vapiRes.json();
            return {
                error: errorData.error || errorData.message || "Failed to fetch evals from Vapi",
                status: vapiRes.status
            };
        }

        const vapiData = await vapiRes.json();

        // Filter only evals that belong to this assistant
        const filteredEvals = (vapiData.results || []).filter((vapiEval: any) =>
            evalIds.includes(vapiEval.id)
        );

        // Merge with local metadata (name, description from DB)
        const evalsWithMetadata = filteredEvals.map((vapiEval: any) => {
            const localEval = assistant.evals.find((evalItem: any) => evalItem.evalId === vapiEval.id);
            return {
                ...vapiEval,
                name: localEval?.name || "",
                description: localEval?.description || "",
                localCreatedAt: localEval?.createdAt,
            };
        });

        return {
            evals: evalsWithMetadata,
            assistant: {
                name: assistant.assistantName,
                vapiAssistantId: assistant.vapiAssistantId
            },
            status: 200
        };
    } catch (e: any) {
        console.error("Error fetching evals:", e);
        return { error: e.message || "Internal server error", status: 500 };
    }
}