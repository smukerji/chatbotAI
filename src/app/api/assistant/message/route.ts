import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: NextRequest) {
  const openai = new OpenAI({
    apiKey: process.env.NEXT_PUBLIC_OPENAI_KEY,
  });

  const assistantId: any = process.env.NEXT_PUBLIC_ASSISTANT_ID;

  const { message, threadId }: any = await req.json();

  if (!message || !threadId) {
    return {
      error: "Invalid message",
    };
  }

  try {
    const threadMessages = await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: message,
    });

    const stream = await openai.beta.threads.runs.stream(threadId, {
      assistant_id: assistantId,
    });

    return new Response(stream.toReadableStream());
  } catch (error) {
    return {
      error: error,
    };
  }
}
