import { openai } from "@/app/openai";
import clientPromise from "@/db";
import { getAssistantTools, getSystemInstruction } from "@/app/_helpers/assistant-creation-contants";
import { buildAssistantTools, buildCapabilityNote, buildGroundingRules } from "@/app/_helpers/server/assistant-tools";

export const runtime = "nodejs";

/**
 * POST /api/assistants/threads/[threadId]/actions
 *
 * Responses API replacement for submitToolOutputsStream.
 *
 * In the Responses API there is no separate "submit tool outputs" call.
 * Instead you pass the tool call outputs as function_call_output items
 * in a new responses.create() call, chained via previous_response_id.
 *
 * Body: {
 *   assistantId: string,
 *   previousResponseId: string,   // response ID that triggered the tool calls
 *   toolCallOutputs: Array<{ tool_call_id: string, output: string }>
 * }
 */
export async function POST(request: any, { params: { threadId } }: any) {
  const { assistantId, previousResponseId, toolCallOutputs } = await request.json();

  const db = (await clientPromise!).db();

  // ── Fetch chatbot config ──────────────────────────────────────────────────
  const [settings, chatbotRecord, calendarToken] = await Promise.all([
    db.collection("chatbot-settings").findOne({ chatbotId: assistantId }),
    db.collection("user-chatbots").findOne({ chatbotId: assistantId }),
    db.collection("google-calendar-tokens").findOne({ chatbotId: assistantId }),
  ]);

  const assistantType = chatbotRecord?.assistantType ?? "";
  const model: string = settings?.model ?? "gpt-4o";
  const temperature: number =
    settings?.temperature !== undefined ? settings.temperature : 1;
  const baseInstruction = settings?.instruction ?? getSystemInstruction(assistantType);

  // ── Tool definitions ──────────────────────────────────────────────────────
  /// must match messages/route.ts exactly — if the two disagree the toolset
  /// changes midway through a conversation that is chained by response id
  const { tools, dropped: droppedTools } = buildAssistantTools({
    assistantType,
    chatbotRecord,
    hasCalendar: !!calendarToken,
  });

  // ── Build function_call_output input items ────────────────────────────────
  // Each item tells the model what the function returned
  const functionOutputItems = (toolCallOutputs as any[]).map((tc: any) => ({
    type: "function_call_output",
    call_id: tc.tool_call_id,
    output: typeof tc.output === "string" ? tc.output : JSON.stringify(tc.output),
  }));

  // ── Full request trace ────────────────────────────────────────────────────
  console.log("\n========== [Responses API] ACTIONS REQUEST ==========");
  console.log("model             :", model);
  console.log("previousResponseId:", previousResponseId);
  console.log("tools             :", tools.map((t: any) => t.name).join(", ") || "(none)");
  console.log(
    "tools_dropped     :",
    Object.keys(droppedTools).length
      ? Object.entries(droppedTools).map(([n, why]) => `${n} (${why})`).join(", ")
      : "(none)"
  );
  console.log("tool_outputs      :", functionOutputItems.map((i: any) => `${i.call_id} → ${String(i.output).slice(0, 150)}`).join("\n                    "));

  /// a tool that returned an error still counts as "answered" — the model gets
  /// the failure text as context and apologises, which looks identical to a
  /// retrieval miss. Call it out so the two are distinguishable in the logs.
  const failedOutputs = functionOutputItems.filter((i: any) => {
    try {
      const parsed = JSON.parse(String(i.output));
      return parsed?.success === false || !!parsed?.error;
    } catch {
      return false;
    }
  });
  console.log(
    "[ToolResult] outputs:", functionOutputItems.length,
    "| failed:", failedOutputs.length,
    failedOutputs.length
      ? `| FIRST_FAILURE: ${String(failedOutputs[0].output).slice(0, 300)}`
      : ""
  );
  if (failedOutputs.length) {
    console.error(
      "[ToolResult] tool returned an error — the model will answer from this failure, not from retrieved data"
    );
  }
  console.log("=====================================================\n");

  // ── Resume the conversation via Responses API ─────────────────────────────
  const responseParams: any = {
    model,
    instructions: baseInstruction,
    input: functionOutputItems,
    tools,
    stream: true,
    previous_response_id: previousResponseId,
    ...(!model.startsWith("o1") && !model.startsWith("o3")
      ? { temperature }
      : { reasoning: { effort: "medium" } }),
  };

  /// the capability limits must hold on the resume turn too, otherwise the
  /// model drops them the moment it comes back from a tool call
  responseParams.instructions = [
    baseInstruction,
    buildCapabilityNote(droppedTools),
    buildGroundingRules(tools.some((t: any) => t.name === "get_reference")),
  ]
    .filter(Boolean)
    .join("\n\n");

  const stream = await openai.responses.create(responseParams);

  // ── Stream through to client while persisting new response ID ────────────
  const encoder = new TextEncoder();
  let capturedResponseId: string | null = null;

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream as any) {
          if (event.type === "response.created" && event.response?.id) {
            capturedResponseId = event.response.id;
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));

          if (event.type === "response.completed" || event.type === "response.done") {
            if (capturedResponseId) {
              await db.collection("chatbot-sessions").updateOne(
                { sessionId: threadId, chatbotId: assistantId },
                { $set: { previousResponseId: capturedResponseId, updatedAt: new Date() } },
                { upsert: true }
              );
            }
          }
        }
      } catch (err) {
        console.error("Responses API actions stream error:", err);
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "error", message: "Stream error" })}\n\n`
          )
        );
      } finally {
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

export const maxDuration = 300;
