import { NextRequest } from "next/server";
import OpenAI from "openai";

export async function POST(req: NextRequest) {
  const openai = new OpenAI({
    apiKey: process.env.NEXT_PUBLIC_OPENAI_KEY,
  });

  const { message, threadId }: any = req.json();

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

    console.log("thread message", threadMessages);

    return {
      message: threadMessages,
    };
  } catch (error) {
    return {
      error: error,
    };
  }
}
