import { randomUUID } from "crypto";

export const runtime = "nodejs";

/**
 * Responses API migration: threads are no longer persisted in OpenAI.
 * We generate a client-side session ID here so the calling code doesn't
 * need to change its contract (still expects { threadId }).
 * The actual conversation state is maintained server-side by OpenAI via
 * previous_response_id chaining in the messages route.
 */
export async function POST() {
  const sessionId = randomUUID();
  return new Response(JSON.stringify({ threadId: sessionId }), {
    headers: { "Content-Type": "application/json" },
  });
}

export const maxDuration = 300;
