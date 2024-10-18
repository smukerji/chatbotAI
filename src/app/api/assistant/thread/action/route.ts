import { NextRequest } from "next/server";
import OpenAI from "openai";

// Send a new message to a thread
export async function POST(request: NextRequest) {
  const { toolCallOutputs, runId, threadId } = await request.json();

  const openai = new OpenAI({
    apiKey: process.env.NEXT_PUBLIC_OPENAI_KEY,
  });

  const stream = openai.beta.threads.runs.submitToolOutputsStream(
    threadId,
    runId,
    // { tool_outputs: [{ output: result, tool_call_id: toolCallId }] },
    {
      tool_outputs: [
        {
          output: JSON.stringify(toolCallOutputs[0].output),
          tool_call_id: toolCallOutputs[0].tool_call_id,
        },
      ],
    }
  );

  console.log("steaaraa", stream.toReadableStream());

  return new Response(stream.toReadableStream());
}
