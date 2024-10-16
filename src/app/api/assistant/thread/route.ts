import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function GET() {
  const openai = new OpenAI({
    apiKey: process.env.NEXT_PUBLIC_OPENAI_KEY,
  });

  try {
    const thread = await openai.beta.threads.create();

    return NextResponse.json({
      thread,
    });
  } catch (error) {
    return {
      error: error,
    };
  }
}
