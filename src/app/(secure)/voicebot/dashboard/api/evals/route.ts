// app/(secure)/voicebot/dashboard/api/evals/route.ts

import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/db";
import { apiHandler } from "@/app/_helpers/server/api/api-handler";



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

        if (!evalName || !vapiAssistantId || !assistantMongoId || !userId || !Array.isArray(turns)) {
            return { error: "Missing required fields!", status: 400 };
        }

        // Convert to Vapi's API contract
        const vapiTurns = turns.map(t => {
            const o: any = {
                role: t.type === "tool-response" ? "tool" : t.type,
                content: t.content,
            };
            if (t.toolCalls?.length > 0) {
                o.toolCalls = t.toolCalls.map((tc: { toolName: string; args: Array<{ key: string; value: string }> }) => ({
                    toolName: tc.toolName,
                    args: tc.args || [],
                }));
            }
            return o;
        });


        const vapiRes = await fetch("https://api.vapi.ai/eval", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.VAPI_PRIVATE_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                messages: vapiTurns,
                type: "chat.mockConversation"
            }),
        });

        const vapiData = await vapiRes.json();
        if (!vapiRes.ok) {
            if (!vapiRes.ok) {
                return {
                    error: vapiData.error || vapiData.message || "Vapi eval error",
                    status: vapiRes.status
                };
            }
        }

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
                        createdAt: new Date(),
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
        return { error: e.message || "Internal server error", status: 500 };
    }
}

async function getEvalsList(req: NextRequest) {
    try {
        const assistantMongoId = req.nextUrl.searchParams.get("assistantId") as string;
        const userId = req.nextUrl.searchParams.get("userId") as string;
        if (!assistantMongoId || !userId) {
            return { error: "assistantId and userId are required", status: 400 };
        }
        const db = (await clientPromise!).db();
        const assistant = await db.collection("voice-assistance").findOne({
            _id: new ObjectId(assistantMongoId),
            userId: new ObjectId(userId),
        });
        if (!assistant) {
            return { error: "Assistant not found", status: 404 };
        }
        return { evals: assistant.evals || [] };
    } catch (err: any) {
        return { error: err.message || "Server error", status: 500 };
    }
}
