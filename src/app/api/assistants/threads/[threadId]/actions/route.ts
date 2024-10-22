import { openai } from "@/app/openai";

// Send a new message to a thread
export async function POST(request: any, { params: { threadId } }: any) {
  const { toolCallOutputs, runId } = await request.json();

  const stream = openai.beta.threads.runs.submitToolOutputsStream(
    threadId,
    runId,
    { tool_outputs: toolCallOutputs }
  );

  return new Response(stream.toReadableStream());
}
