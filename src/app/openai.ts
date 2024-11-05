import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_KEY,
  organization: process.env.NEXT_PUBLIC_OPENAI_ORG_KEY,
  project: process.env.NEXT_PUBLIC_OPENAI_PROJ_KEY,
});
