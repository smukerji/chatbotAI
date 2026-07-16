/**
 * ResponseStream
 *
 * Client-side SSE parser for the Responses API stream.
 *
 * Event sequence the Responses API emits:
 *   TEXT turn:
 *     response.created → response.output_item.added (message) →
 *     response.content_part.added → response.output_text.delta (N×) →
 *     response.output_text.done → response.content_part.done →
 *     response.output_item.done → response.completed → [DONE]
 *
 *   TOOL CALL turn:
 *     response.created → response.output_item.added (function_call) →
 *     response.function_call_arguments.delta (N×) →
 *     response.function_call_arguments.done →
 *     response.output_item.done (function_call) →
 *     response.completed → [DONE]
 *
 * Emitted events:
 *   "textCreated"    → () — first text chunk is about to arrive
 *   "textDelta"      → { value: string } — incremental text
 *   "requiresAction" → { responseId, toolCalls[] } — tool calls ready
 *   "completed"      → () — turn fully done (text or after tool outputs)
 *   "error"          → { message: string }
 */

type EventMap = {
  textCreated: void;
  textDelta: { value: string };
  requiresAction: { responseId: string; toolCalls: ToolCall[] };
  completed: void;
  error: { message: string };
};

export type ToolCall = {
  id: string;        // call_id — used when submitting outputs
  name: string;      // function name
  arguments: string; // JSON string of arguments
};

type Listener<K extends keyof EventMap> = (data: EventMap[K]) => void;

export class ResponseStream {
  private body: ReadableStream<Uint8Array>;
  private listeners: { [K in keyof EventMap]?: Listener<K>[] } = {};
  private textStarted = false;

  constructor(body: ReadableStream<Uint8Array>) {
    this.body = body;
  }

  on<K extends keyof EventMap>(event: K, listener: Listener<K>): this {
    if (!this.listeners[event]) {
      (this.listeners[event] as any) = [];
    }
    (this.listeners[event] as any[]).push(listener);
    return this;
  }

  private emit<K extends keyof EventMap>(event: K, data?: EventMap[K]): void {
    const fns = this.listeners[event] as Listener<K>[] | undefined;
    if (fns) fns.forEach((f) => f(data as EventMap[K]));
  }

  /** Start consuming the stream. Resolves when the stream ends. */
  async start(): Promise<void> {
    const reader = this.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    // State accumulated across events
    const partialArgs: Record<string, string> = {};  // call_id → accumulated arg string
    let currentResponseId = "";
    let hasPendingToolCalls = false;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();

          // [DONE] — stream is fully over
          if (raw === "[DONE]") {
            // Only emit completed here if no tool calls were pending
            // (tool calls emit completed after their outputs are processed)
            if (!hasPendingToolCalls) {
              this.emit("completed");
            }
            return;
          }

          let event: any;
          try {
            event = JSON.parse(raw);
          } catch {
            continue;
          }

          const { type } = event;

          // ── Capture response ID ───────────────────────────────────────────
          if (type === "response.created" && event.response?.id) {
            currentResponseId = event.response.id;
          }

          // ── Text output begins ────────────────────────────────────────────
          if (type === "response.output_item.added") {
            const item = event.item;
            if (item?.type === "message") {
              if (!this.textStarted) {
                this.textStarted = true;
                this.emit("textCreated");
              }
            }
            // Register incoming function_call items
            if (item?.type === "function_call" && item.call_id) {
              partialArgs[item.call_id] = "";
            }
          }

          // ── Streaming text delta ──────────────────────────────────────────
          if (type === "response.output_text.delta") {
            this.emit("textDelta", { value: event.delta ?? "" });
          }

          // ── Streaming function call arguments ─────────────────────────────
          if (type === "response.function_call_arguments.delta") {
            const callId: string = event.call_id ?? event.item_id ?? "";
            if (callId) {
              partialArgs[callId] = (partialArgs[callId] ?? "") + (event.delta ?? "");
            }
          }

          // ── Function call output item fully done ──────────────────────────
          // This is the most reliable event: the item object contains
          // name + call_id + fully-assembled arguments.
          if (type === "response.output_item.done") {
            const item = event.item;
            if (item?.type === "function_call") {
              hasPendingToolCalls = true;
            }
          }

          // ── response.completed — all output items are done ────────────────
          if (type === "response.completed") {
            const responseId: string = event.response?.id ?? currentResponseId;
            const outputItems: any[] = event.response?.output ?? [];

            const fnItems = outputItems.filter((o: any) => o.type === "function_call");

            if (fnItems.length > 0) {
              hasPendingToolCalls = true;
              const toolCalls: ToolCall[] = fnItems.map((item: any) => ({
                id: item.call_id,
                name: item.name,
                // Use fully-assembled arguments from the item itself;
                // fall back to what we accumulated from delta events
                arguments: item.arguments ?? partialArgs[item.call_id] ?? "{}",
              }));

              // Emit requiresAction — client will call the tools and then
              // POST results to /actions. The "completed" event will be
              // emitted by the ResponseStream created for that second request.
              this.emit("requiresAction", { responseId, toolCalls });
              // Do NOT emit "completed" here — the conversation isn't done yet
            } else {
              // Pure text turn — safe to complete
              this.emit("completed");
            }
          }

          // ── Error from OpenAI ─────────────────────────────────────────────
          if (type === "error") {
            this.emit("error", { message: event.message ?? "Unknown error from API" });
          }
        }
      }
    } catch (err: any) {
      this.emit("error", { message: err?.message ?? "Unknown stream error" });
    } finally {
      reader.releaseLock();
    }
  }
}
