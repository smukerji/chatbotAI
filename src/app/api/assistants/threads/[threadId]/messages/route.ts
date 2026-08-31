import { openai } from "@/app/openai";
import clientPromise from "@/db";
import { getAssistantTools, getSystemInstruction } from "@/app/_helpers/assistant-creation-contants";
import { buildAssistantTools, buildFullInstructions } from "@/app/_helpers/server/assistant-tools";

export const runtime = "nodejs";

/// buildDynamicContext now lives in _helpers/server/assistant-tools.ts, beside
/// buildFullInstructions, so both turns of a tool call compose identical
/// instructions. Keeping it next to one route is what let the two drift apart:
/// the turn that wrote the answer from a tool result was missing the grounding
/// rules entirely.

/**
 * POST /api/assistants/threads/[threadId]/messages
 *
 * Responses API replacement for the Assistants API messages + run endpoint.
 * - threadId is now a local session UUID (no longer an OpenAI thread ID)
 * - previousResponseId is stored per-session in the chatbot-sessions collection
 *   so that conversation context is chained via previous_response_id
 * - Streams the response back using SSE (server-sent events) in a format
 *   compatible with the client-side parser in ResponseStream.ts
 */
export async function POST(request: any, { params: { threadId } }: any) {
  const { content, assistantId } = await request.json();

  const db = (await clientPromise!).db();

  // ── Fetch chatbot config ──────────────────────────────────────────────────
  const [settings, chatbotRecord, calendarToken] = await Promise.all([
    db.collection("chatbot-settings").findOne({ chatbotId: assistantId }),
    db.collection("user-chatbots").findOne({ chatbotId: assistantId }),
    db.collection("google-calendar-tokens").findOne({ chatbotId: assistantId }),
  ]);

  const businessTimezone = settings?.bookingTimezone ?? "UTC";
  const assistantType = chatbotRecord?.assistantType ?? "";
  const model: string = settings?.model ?? "gpt-4o";
  /// These assistants answer from retrieved content and tool results, where
  /// sampling variance shows up as fabricated facts rather than as pleasant
  /// variety - the same question answered correctly once and invented the next
  /// time. Published guidance for grounded RAG is 0.1-0.2; the other channels in
  /// this codebase already default low (webhook uses ?? 0, others hardcode 0.2 /
  /// 0.5) while this path used 1, so the same chatbot behaved differently
  /// depending on where it was asked. Chatbots with a stored temperature keep
  /// their own value; this only changes the default for those without one.
  const temperature: number =
    settings?.temperature !== undefined ? settings.temperature : 0.2;

  // Build instructions: base system prompt + dynamic context
  const baseInstruction = settings?.instruction ?? getSystemInstruction(assistantType);

  // ── Get schema_info for structured data sources ───────────────────────────
  const assistantData = await db
    .collection("chatbots-data")
    .find({ chatbotId: assistantId })
    .toArray();
  const schemaInfo = assistantData
    .map((data: any) => data.schema_info)
    .filter((info: any) => info !== undefined);

  const userInput = schemaInfo.length > 0
    ? `userQuery: ${content} \n\n schema_info: ${JSON.stringify(schemaInfo)}`
    : content;

  // ── Retrieve previousResponseId for this session ──────────────────────────
  const sessionDoc = await db
    .collection("chatbot-sessions")
    .findOne({ sessionId: threadId, chatbotId: assistantId });
  const previousResponseId: string | null = sessionDoc?.previousResponseId ?? null;

  // ── Tool definitions ──────────────────────────────────────────────────────
  // getAssistantTools returns Assistants API shape: { type, function: { name, ... } }
  // Responses API expects the flat shape:           { type, name, description, parameters, strict }
  /// only offer tools this chatbot can actually fulfil — see assistant-tools.ts
  const { tools, dropped: droppedTools } = buildAssistantTools({
    assistantType,
    chatbotRecord,
    hasCalendar: !!calendarToken,
  });

  /// the prompt templates tell the assistant to take bookings and look up
  /// orders regardless of what is connected — without this it happily claims to
  /// have booked an appointment it has no way to create
  /// without these the assistant answers general-knowledge questions from its
  /// own memory and skips retrieval on questions it does hold content for.
  /// Composed by the shared helper so the answering turn in actions/route.ts
  /// gets byte-identical instructions — see buildFullInstructions.
  const fullInstructions = buildFullInstructions({
    baseInstruction,
    businessTimezone,
    canBook: !!calendarToken,
    dropped: droppedTools,
    hasRetrieval: tools.some((t: any) => t.name === "get_reference"),
  });

  /// Force retrieval rather than leaving it to the model.
  ///
  /// tool_choice defaulted to "auto", so whether get_reference ran was sampled
  /// at the chatbot's temperature - 1 for most of them. Observed: asking "what
  /// this means in code: Python SDK v2" produced a confident answer built from
  /// a one-line summary already in the thread, while the uploaded document had
  /// a section by exactly that name containing the code. No search happened and
  /// nothing indicated one had been skipped.
  ///
  /// Instructions alone do not fix this. buildGroundingRules already says
  /// "SEARCH BEFORE YOU DECIDE ... call get_reference FIRST" and it was ignored;
  /// tool_choice is enforced by the API rather than by prompt compliance, which
  /// is the difference between a fix and a hope.
  ///
  /// Small talk is exempted so "hi" does not trigger a vector search. The test
  /// is deliberately narrow - a short message that is ONLY a greeting - because
  /// the cost of wrongly forcing a search is one wasted lookup, while wrongly
  /// skipping one is an ungrounded answer.
  const isSmallTalk =
    typeof content === "string" &&
    content.trim().length <= 40 &&
    /^\s*(hi|hey|hello|yo|thanks?|thank you|ty|ok(ay)?|cool|great|nice|bye|goodbye|good (morning|afternoon|evening))[\s!.,?]*$/i.test(
      content.trim()
    );
  const hasRetrievalTool = tools.some((t: any) => t.name === "get_reference");
  const forceRetrieval = hasRetrievalTool && !isSmallTalk;

  // ── Responses API call (streaming) ────────────────────────────────────────
  const responseParams: any = {
    model,
    instructions: fullInstructions,
    input: userInput,
    tools,
    stream: true,
    ...(forceRetrieval
      ? { tool_choice: { type: "function", name: "get_reference" } }
      : {}),
    ...(previousResponseId ? { previous_response_id: previousResponseId } : {}),
    // Only set temperature for models that support it (not o1/o3)
    ...(!model.startsWith("o1") && !model.startsWith("o3")
      ? { temperature }
      : { reasoning: { effort: "medium" } }),
  };

  // ── Full request trace ────────────────────────────────────────────────────
  console.log("\n========== [Responses API] REQUEST ==========");
  console.log("model          :", model);
  console.log("assistantType  :", assistantType);
  console.log("previousRespId :", previousResponseId ?? "(none — new session)");
  console.log("temperature    :", responseParams.temperature ?? "n/a (reasoning model)");
  console.log("tools          :", tools.map((t: any) => t.name).join(", ") || "(none)");
  /// tool_choice is never set, so the api defaults to "auto" — the model picks
  /// whether to retrieve. With temperature 1 that choice varies between runs,
  /// which is why the same question sometimes skips get_reference entirely.
  console.log(
    "tool_choice    :",
    responseParams.tool_choice
      ? `FORCED get_reference${isSmallTalk ? "" : " (non-small-talk message)"}`
      : isSmallTalk
      ? "auto — small talk, retrieval not forced"
      : "auto — no get_reference tool available"
  );
  console.log("has_get_reference:", tools.some((t: any) => t.name === "get_reference"));
  /// if a bot loses a capability unexpectedly, this line says which and why
  console.log(
    "tools_dropped  :",
    Object.keys(droppedTools).length
      ? Object.entries(droppedTools).map(([n, why]) => `${n} (${why})`).join(", ")
      : "(none)"
  );
  console.log("--- instructions (first 600 chars) ---");
  console.log(fullInstructions.slice(0, 600));
  console.log("--- input ---");
  console.log(typeof userInput === "string" ? userInput.slice(0, 400) : JSON.stringify(userInput).slice(0, 400));
  console.log("=============================================\n");

  const stream = await openai.responses.create(responseParams);

  // ── Stream through to client while capturing response ID ──────────────────
  const encoder = new TextEncoder();
  let capturedResponseId: string | null = null;

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream as any) {
          // Capture the response ID from the first response.created event
          if (event.type === "response.created" && event.response?.id) {
            capturedResponseId = event.response.id;
            console.log("[ResponsesAPI] response.created  id:", capturedResponseId);
          }

          // Trace key events
          if (event.type === "response.output_item.added") {
            console.log("[ResponsesAPI] output_item.added  type:", event.item?.type, event.item?.type === "function_call" ? `name=${event.item.name} call_id=${event.item.call_id}` : "");
          }
          if (event.type === "response.function_call_arguments.done") {
            console.log("[ResponsesAPI] fn_args.done  call_id:", event.call_id, "args:", event.arguments?.slice(0, 200));
          }
          if (event.type === "response.output_item.done" && event.item?.type === "function_call") {
            console.log("[ResponsesAPI] output_item.done  FUNCTION_CALL  name:", event.item.name, "args:", event.item.arguments?.slice(0, 200));
          }
          if (event.type === "response.completed") {
            const output = event.response?.output ?? [];
            console.log("[ResponsesAPI] response.completed  output_items:", output.map((o: any) => o.type).join(", ") || "(empty)");

            /// the decisive line for "why did it not hit pinecone this time":
            /// with tool_choice=auto the model may answer straight from its own
            /// knowledge and never call get_reference, which reads as a wrong
            /// or hallucinated answer rather than an error
            const fnCalls = output.filter((o: any) => o.type === "function_call");
            console.log(
              "[ToolDecision] tools_offered:", tools.map((t: any) => t.name).join(",") || "(none)",
              "| tool_choice:", responseParams.tool_choice ?? "auto",
              "| temperature:", responseParams.temperature ?? "n/a",
              "| functions_called:", fnCalls.length ? fnCalls.map((f: any) => f.name).join(",") : "NONE",
              "| retrieval_used:", fnCalls.some((f: any) => f.name === "get_reference"),
              "| chained_from:", previousResponseId ?? "(new session)"
            );
            if (!fnCalls.length) {
              console.warn(
                "[ToolDecision] model answered WITHOUT calling any tool — reply is from model knowledge, not the chatbot's indexed data"
              );
            }

            const textItems = output.filter((o: any) => o.type === "message");
            if (textItems.length) {
              const text = textItems[0]?.content?.map((c: any) => c.text ?? "").join("") ?? "";
              console.log("[ResponsesAPI] assistant_text:", text.slice(0, 300));
            }
          }

          // Forward the raw SSE event to the client
          const data = JSON.stringify(event);
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));

          // When done, persist the new response ID for next turn
          if (event.type === "response.completed" || event.type === "response.done") {
            if (capturedResponseId) {
              await db.collection("chatbot-sessions").updateOne(
                { sessionId: threadId, chatbotId: assistantId },
                { $set: { previousResponseId: capturedResponseId, updatedAt: new Date() } },
                { upsert: true }
              );
              console.log("[ResponsesAPI] session updated  previousResponseId:", capturedResponseId);
            }
          }
        }
      } catch (err) {
        console.error("Responses API stream error:", err);
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
