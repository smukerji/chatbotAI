import { apiHandler } from "@/app/_helpers/server/api/api-handler";
import { openai } from "@/app/openai";
import clientPromise from "@/db";
import { NextRequest } from "next/server";

async function migrateChatBot(request: NextRequest) {
  /// get the chatbotId from the request body
  const body = await request.json();
  const chatbotId = body.chatbotId;
  const userId = body.userId;

  if (!chatbotId) {
    return {
      message: "Chatbot ID is required",
      status: 400,
    };
  }

  return { message: "Migration not supported" };
  console.log(`Migrating chatbot with ID: ${chatbotId} for user ID: ${userId}`);

  /// call the chat api of openai to modify the system prompt for the chatbot
  /// step 1 get the chatbot existing data from the database
  const db = (await clientPromise!).db();
  const chatBotSettingCollection = db.collection("chatbot-settings");

  const data = await chatBotSettingCollection.findOne({
    chatbotId: chatbotId,
    userId: userId,
  });

  console.log("Chatbot data retrieved:", data);

  const existingPrompt = data.chatbotSetting?.instruction;

  /// step 2 modify the system prompt to v3 format
  const chatCompletionResponse = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `I want you to act as a prompt modifier. I will provide you with the old prompt and the reference prompt. Your task is to convert the old prompt to a new prompt using the reference prompt.



Note: RETRIEVER is the new function name for get_reference.



You have to keep the context of the old prompt but, as the tool names have been changed, you need to use the reference prompt tools to generate the new prompt.



You should only the get_reference and convert it to the RETRIEVER function from the old prompt make sure to remove all the other tools or function from the old prompt when writing new prompt But keep the name or tone etc from the old prompt only remove the tool and function.

`,
      },
      {
        role: "user",
        content: `Output only the new prompt without any other characters or preceding text. And remove the context to reply in HTML format as it is not  needed. Make sure you keep the context of reference prompt as it is important. and make sure to include RETRIEVER tool or RETRIEVERDB tool. 
Make sure to remove all the other tools or function from the old prompt when writing new prompt But keep the name or tone etc from the old prompt only remove the tool and function.

old prompt:
###\n\n${existingPrompt}\n\n


Reference prompt:
###
I want you to act as a support agent named Torri. Use the RETRIEVER tool get the relavent document to help answer to chatInput.

    - If the conversation is formal and the query can be answered without using the RETRIEVER tool or RETRIEVERDB tool respond directly and professionally.

    - Otherwise, use the RETRIEVER tool to retrieve the necessary information and answer accordingly first. If the information is not available, then use the RETRIEVERDB tool to get the relevant document and answer accordingly.

    - Only respond based on the information available from RETRIEVER tool or RETRIEVERDB tool. If the required information is not available after calling RETRIEVER tool then only, call the RETRIEVERDB tool.
    - Strictly Don't modify the response of RETRIEVERDB tool. Return the response as it was retrieved.
    - If the information is not available in both the tools, reply with : "I'm still learning. I hope to get back to you."

    - Always be polite, add a warm greeting at the beginning, and close on a courteous note.
###`,
      },
    ],
  });
  const migratedPrompt = chatCompletionResponse.choices[0].message.content;

  console.log("Migrated Prompt:", migratedPrompt);

  /// step 3 update the chatbot settings with the new prompt
  await chatBotSettingCollection.updateOne(
    { chatbotId: chatbotId, userId: userId },
    { $set: { instructions: migratedPrompt } }
  );

  const chatbotCollection = db.collection("chatbots");

  /// update the chatbot settings
  await chatbotCollection.updateOne(
    { chatbotId: chatbotId, userId: userId },
    { $set: { botType: "bot-v3" } }
  );

  return {
    message: "Migrated chatbot to v3 successfully",
    status: 200,
  };
}

module.exports = apiHandler({
  POST: migrateChatBot,
});
