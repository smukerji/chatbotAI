import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export async function GET(req: NextRequest) {
  const openai = new OpenAI({
    apiKey: process.env.NEXT_PUBLIC_OPENAI_KEY,
  });

  const url = new URL(req.url);
  const threadId: any = url.searchParams.get("threadId");

  try {
    const thread = await openai.beta.threads.retrieve(threadId);

    console.log("threaaddd", thread);

    return NextResponse.json({
      thread,
    });
  } catch (error) {
    return {
      error: error,
    };
  }
}
