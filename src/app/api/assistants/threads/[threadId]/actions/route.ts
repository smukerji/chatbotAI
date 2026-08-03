import { openai } from "@/app/openai";
import clientPromise from "@/db";
import { getAssistantTools, getSystemInstruction } from "@/app/_helpers/assistant-creation-contants";

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
  const [settings, chatbotRecord] = await Promise.all([
    db.collection("chatbot-settings").findOne({ chatbotId: assistantId }),
    db.collection("user-chatbots").findOne({ chatbotId: assistantId }),
  ]);

  const assistantType = chatbotRecord?.assistantType ?? "";
  const model: string = settings?.model ?? "gpt-4o";
  const temperature: number =
    settings?.temperature !== undefined ? settings.temperature : 1;
  const baseInstruction = settings?.instruction ?? getSystemInstruction(assistantType);

  // ── Tool definitions (flatten from Assistants API shape to Responses API shape) ──
  const tools = getAssistantTools(assistantType).map((t: any) => ({
    type: "function" as const,
    name: t.function.name,
    description: t.function.description,
    parameters: t.function.parameters,
    ...(t.function.strict !== undefined ? { strict: t.function.strict } : {}),
  }));

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
  console.log("tool_outputs      :", functionOutputItems.map((i: any) => `${i.call_id} → ${String(i.output).slice(0, 150)}`).join("\n                    "));
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
