import { openai } from "@/app/openai";

export const runtime = "nodejs";

// Create a new thread
export async function POST() {
  const thread = await openai.beta.threads.create();
  // Return the response with JSON content
  return new Response(JSON.stringify({ threadId: thread.id }), {
    headers: { "Content-Type": "application/json" },
  });
}

export const maxDuration = 300;