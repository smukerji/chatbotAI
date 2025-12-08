

import { NextRequest } from "next/server";
import { apiHandler } from "@/app/_helpers/server/api/api-handler";

type ModelInfo = {
  id: string;   
  label: string; 
};

type ProviderInfo = {
  id: string;     
  label: string;
  models: ModelInfo[];
};

// Full provider + model list
const PROVIDERS: ProviderInfo[] = [
  {
    id: "openai",
    label: "OpenAI",
    models: [
      { id: "gpt-4o", label: "GPT‑4o" },
      { id: "gpt-4o-mini", label: "GPT‑4o Mini" },
      { id: "gpt-4o-latest", label: "ChatGPT‑4o Latest" },
      { id: "gpt-5.1", label: "GPT‑5.1" },
      { id: "gpt-5.1-instant", label: "GPT‑5.1 Instant" },
      { id: "gpt-5", label: "GPT‑5" },
      { id: "gpt-5-mini", label: "GPT‑5 Mini" },
      { id: "gpt-5-nano", label: "GPT‑5 Nano" },

      // 4.1 variants
      { id: "gpt-4.1", label: "GPT‑4.1" },
      { id: "gpt-4.1-mini", label: "GPT‑4.1 Mini" },
      { id: "gpt-4.1-nano", label: "GPT‑4.1 Nano" },
      { id: "gpt-4.1-2025-04-14", label: "GPT‑4.1 (2025‑04‑14)" },
      { id: "gpt-4.1-mini-2025-04-14", label: "GPT‑4.1 Mini (2025‑04‑14)" },
      { id: "gpt-4.1-nano-2025-04-14", label: "GPT‑4.1 Nano (2025‑04‑14)" },

      // O‑series
      { id: "o3", label: "O3" },
      { id: "o3-mini", label: "O3 Mini" },
      { id: "o4-mini", label: "O4 Mini" },
      { id: "o1-mini", label: "O1 Mini" },
      { id: "o1-mini-2024-09-12", label: "O1 Mini (2024‑09‑12)" },

      // regional GPT‑4o 05‑13
      { id: "gpt-4o-05-13-eastus2", label: "GPT‑4o 05‑13 (East US 2)" },
      { id: "gpt-4o-05-13-eastus", label: "GPT‑4o 05‑13 (East US)" },
      { id: "gpt-4o-05-13-northcentralus", label: "GPT‑4o 05‑13 (North Central US)" },
      { id: "gpt-4o-05-13-southcentralus", label: "GPT‑4o 05‑13 (South Central US)" },
      { id: "gpt-4o-05-13-westus3", label: "GPT‑4o 05‑13 (West US 3)" },
      { id: "gpt-4o-05-13-westus", label: "GPT‑4o 05‑13 (West US)" },

      // older GPT‑4o
      { id: "gpt-4o-2024-05-13", label: "GPT‑4o (2024‑05‑13)" },
      { id: "gpt-4o-2024-08-06", label: "GPT‑4o (2024‑08‑06)" },
      { id: "gpt-4o-2024-11-20", label: "GPT‑4o (2024‑11‑20)" },

      // GPT‑4 Turbo and previews
      { id: "gpt-4-turbo", label: "GPT‑4 Turbo" },
      { id: "gpt-4-turbo-2024-04-09", label: "GPT‑4 Turbo (2024‑04‑09)" },
      { id: "gpt-4-turbo-preview", label: "GPT‑4 Turbo Preview" },
      { id: "gpt-4-0125-preview", label: "GPT‑4 0125 Preview" },
      { id: "gpt-4-1106-preview", label: "GPT‑4 1106 Preview" },
      { id: "gpt-4", label: "GPT‑4" },
      { id: "gpt-4-0613-canadaeast", label: "GPT‑4 0613 (Canada East)" },

      // GPT‑3.5 Turbo
      { id: "gpt-3.5-turbo-0125-canadaeast", label: "GPT‑3.5 Turbo 0125 (Canada East)" },
      { id: "gpt-3.5-turbo-0125-northcentralus", label: "GPT‑3.5 Turbo 0125 (North Central US)" },
      { id: "gpt-3.5-turbo-0125-southcentralus", label: "GPT‑3.5 Turbo 0125 (South Central US)" },
      { id: "gpt-3.5-turbo-1106-canadaeast", label: "GPT‑3.5 Turbo 1106 (Canada East)" },
      { id: "gpt-3.5-turbo-1106-westus", label: "GPT‑3.5 Turbo 1106 (West US)" },
    ],
  },
  {
    id: "anthropic",
    label: "Anthropic",
    models: [
      { id: "claude-3-opus-20240229", label: "Claude 3 Opus (Feb '24)" },
      { id: "claude-3-sonnet-20240229", label: "Claude 3 Sonnet (Feb '24)" },
      { id: "claude-3-haiku-20240307", label: "Claude 3 Haiku (Mar '24)" },
      { id: "claude-3-5-sonnet-20240620", label: "Claude 3.5 Sonnet (Jun '24)" },
      { id: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet (Oct '24)" },
      { id: "claude-3-5-haiku-20241022", label: "Claude 3.5 Haiku (Oct '24)" },
      { id: "claude-3-7-sonnet-20250219", label: "Claude 3.7 Sonnet (Feb '25)" },
      { id: "claude-opus-4-20250514", label: "Claude Opus 4 (May '25)" },
      { id: "claude-opus-4-5-20251101", label: "Claude Opus 4.5 (Nov '25)" },
      { id: "claude-sonnet-4-20250514", label: "Claude Sonnet 4 (May '25)" },
      { id: "claude-sonnet-4-5-20250929", label: "Claude Sonnet 4.5 (Sep '25)" },
      { id: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5 (Oct '25)" },
    ],
  },
  {
    id: "google",
    label: "Google",
    models: [
      { id: "gemini-1.5-pro", label: "Gemini 1.5 Pro" },
      { id: "gemini-1.5-flash", label: "Gemini 1.5 Flash" },
    ],
  },
  {
    id: "groq",
    label: "Groq",
    models: [
      { id: "llama-3-8b", label: "Llama‑3 8B" },
      { id: "llama-3-70b", label: "Llama‑3 70B" },
    ],
  },

];

module.exports = apiHandler({
  GET: async (_req: NextRequest) => {
    return {
      providers: PROVIDERS,
      status: 200,
    };
  },
});
