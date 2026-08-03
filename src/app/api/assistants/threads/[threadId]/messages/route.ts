import { openai } from "@/app/openai";
import clientPromise from "@/db";
import { getAssistantTools, getSystemInstruction } from "@/app/_helpers/assistant-creation-contants";

export const runtime = "nodejs";

/**
 * Build the dynamic context injected into every turn's instructions.
 * Matches the previous additional_instructions content exactly.
 */
function buildDynamicContext(businessTimezone: string): string {
  const now = new Date();
  const isoNow = now.toISOString();
  const utcDate = now.toUTCString();
  const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const todayName = weekdays[now.getUTCDay()];
  const tomorrow = new Date(now);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const tomorrowISO = tomorrow.toISOString().slice(0, 10);

  let localNow = isoNow;
  try {
    localNow = new Intl.DateTimeFormat("en-CA", {
      timeZone: businessTimezone,
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      hour12: false,
    }).format(now).replace(",", "");
  } catch { /* invalid tz — fall back to ISO */ }

  return `
## SYSTEM OVERRIDE — Dynamic Context (HIGHEST PRIORITY — these rules override all previous instructions)

CURRENT_DATETIME_UTC: ${isoNow}
CURRENT_DATETIME_LOCAL (${businessTimezone}): ${localNow}
CURRENT_DATE_HUMAN: ${utcDate}
TODAY_WEEKDAY: ${todayName}
TOMORROW_DATE: ${tomorrowISO}
BUSINESS_TIMEZONE: ${businessTimezone}

### CRITICAL BOOKING RULES — MUST follow exactly, no exceptions:

1. **NEVER ask for information already given.** Scan the ENTIRE conversation before asking anything. If the user already provided a value (name, email, phone, date, time, service), do NOT ask for it again under any circumstances.

2. **Extract ALL fields from a single message.** If the user provides name + email + phone + date + time + service in one message, extract every field silently and proceed directly to calling the booking function. Do NOT ask follow-up questions about fields already given.

3. **Resolve relative dates silently.** "tomorrow" = ${tomorrowISO}. "today" = ${isoNow.slice(0, 10)}. NEVER ask the user to confirm or restate a date they already gave in plain English.

4. **Resolve 12-hour times silently.** "6 pm" = 18:00, "2 pm" = 14:00, "9 am" = 09:00, "noon" = 12:00. NEVER ask the user to restate a time in 24-hour format.

5. **BUSINESS_TIMEZONE = "${businessTimezone}".** Use this for all bookings. NEVER ask the user for their timezone.

6. **dateTime format = "YYYY-MM-DDTHH:MM:SS".** Always include the time component. Example: "2026-07-17T18:00:00".

7. **After user says "yes" or confirms any field — move on.** Do NOT re-ask or re-confirm already confirmed information.

8. **The "ask one thing at a time" rule applies ONLY to genuinely missing fields.** If all required fields are already present in the conversation, call the booking function immediately without asking anything.

### Required fields checklist before calling create_booking:
- customerName ✓ if mentioned anywhere in conversation
- customerEmail ✓ if mentioned anywhere in conversation  
- customerPhone ✓ if mentioned anywhere in conversation
- serviceType ✓ if mentioned anywhere in conversation
- dateTime ✓ if any date+time was mentioned (resolve automatically)
- timezone = ${businessTimezone} (always pre-filled, never ask)
`.trim();
}

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
  const [settings, chatbotRecord] = await Promise.all([
    db.collection("chatbot-settings").findOne({ chatbotId: assistantId }),
    db.collection("user-chatbots").findOne({ chatbotId: assistantId }),
  ]);

  const businessTimezone = settings?.bookingTimezone ?? "UTC";
  const assistantType = chatbotRecord?.assistantType ?? "";
  const model: string = settings?.model ?? "gpt-4o";
  const temperature: number =
    settings?.temperature !== undefined ? settings.temperature : 1;

  // Build instructions: base system prompt + dynamic context
  const baseInstruction = settings?.instruction ?? getSystemInstruction(assistantType);
  const dynamicContext = buildDynamicContext(businessTimezone);
  const fullInstructions = `${baseInstruction}\n\n${dynamicContext}`;

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
  const tools = getAssistantTools(assistantType).map((t: any) => ({
    type: "function" as const,
    name: t.function.name,
    description: t.function.description,
    parameters: t.function.parameters,
    ...(t.function.strict !== undefined ? { strict: t.function.strict } : {}),
  }));

  // ── Responses API call (streaming) ────────────────────────────────────────
  const responseParams: any = {
    model,
    instructions: fullInstructions,
    input: userInput,
    tools,
    stream: true,
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
