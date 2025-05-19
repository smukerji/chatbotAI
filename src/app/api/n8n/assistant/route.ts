import { AssistantType } from "@/app/_helpers/assistant-creation-contants";
import { getn8nInstruction } from "@/app/_helpers/n8n-workflow-constant";
import axios from "axios";

export async function POST(request: Request) {
  const body = await request.json();
  const { chatbotId, chatInput, userId, sessionId, assistantType } = body;

  let pineconeIndex = process.env.NEXT_PUBLIC_PINECONE_INDEX;

  let payload = {
    chatbotId,
    chatInput,
    userId,
    sessionId,
    pineconeIndex,
  };

  let n8nUrl = "";

  // Set payload based on selection
  if (assistantType === AssistantType.ECOMMERCE_AGENT_SHOPIFY) {
    payload = {
      ...payload,
      ...getn8nInstruction(AssistantType.ECOMMERCE_AGENT_SHOPIFY),
    };
    n8nUrl = process.env.SHOPIFY_N8N_URL!;
  } else {
    payload = { ...payload, ...getn8nInstruction() };
    n8nUrl = process.env.RAG_N8N_URL!;
  }

  try {
    const response = await axios.post(n8nUrl, payload);

    if (response.status === 200) {
      //   console.log(response.data, "response n8n >>>>>>>>>>>>>>>>>");

      const reply = response.data?.output;

      return new Response(JSON.stringify({ message: reply }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      });
    } else {
      throw new Error(`Status ${response.status}: ${response.statusText}`);
    }
  } catch (error: any) {
    console.error("Error in n8n assistant route:", error);

    const errorMessage =
      error?.response?.data?.message ||
      error?.message ||
      "An error occurred while processing your request.";

    return new Response(
      JSON.stringify({
        message: errorMessage,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
