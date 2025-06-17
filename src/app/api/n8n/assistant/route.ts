import { AssistantType } from "@/app/_helpers/assistant-creation-contants";
import { getn8nInstruction } from "@/app/_helpers/n8n-workflow-constant";
import clientPromise from "@/db";
import axios from "axios";

export async function POST(request: Request) {
  const body = await request.json();
  const { chatbotId, chatInput, userId, sessionId, assistantType } = body;

  let pineconeIndex = process.env.NEXT_PUBLIC_PINECONE_INDEX;

  let payload: any = {
    chatbotId,
    chatInput,
    userId,
    sessionId,
    pineconeIndex,
  };

  let n8nUrl = "";

  /// get the schema_info if any from chatbots-data
  const db = (await clientPromise!).db();
  const collection = db.collection("chatbots-data");
  /// all the data sources of this assistant id and it contains schema_info object
  const assistantData = await collection
    .find({
      chatbotId: chatbotId,
    })
    .toArray();

  /// extract all the schema_info who are not undefined from the assistantData
  const schemaInfo = assistantData
    .map((data: any) => data.schema_info)
    .filter((info: any) => info !== undefined);

  // Set payload based on selection
  if (assistantType === AssistantType.ECOMMERCE_AGENT_SHOPIFY) {
    const { instruction, ragAgentInstruction } = getn8nInstruction(
      AssistantType.ECOMMERCE_AGENT_SHOPIFY
    );
    payload = {
      ...payload,
      systemPrompt: instruction,
      ragAgentSystemPrompt: ragAgentInstruction,
    };
    n8nUrl = process.env.SHOPIFY_N8N_URL!;
  } else if (assistantType === AssistantType.CUSTOMER_SUPPORT_AGENT) {
    const { ragAgentInstruction } = getn8nInstruction(
      AssistantType.CUSTOMER_SUPPORT_AGENT
    );
    payload = {
      ...payload,
      ragAgentSystemPrompt: ragAgentInstruction,
      getChatHistoryURL:
        process.env.NEXT_PUBLIC_WEBSITE_URL +
        `api/chathistory?chatbotId=${chatbotId}&userId=${userId}&sessionId=${sessionId}`,
    };
    n8nUrl = process.env.CUSTOMER_SUPPORT_N8N_URL!;
  } else {
    payload = {
      ...payload,
      systemPrompt: getn8nInstruction()?.instruction,
      schemaInfo: JSON.stringify(schemaInfo),
    };
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
