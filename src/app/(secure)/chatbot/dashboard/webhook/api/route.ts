import { NextRequest, NextResponse } from "next/server";

import clientPromise from "@/db";
import { ObjectId } from "mongodb";
import { encodeChat, encode, decode, isWithinTokenLimit } from "gpt-tokenizer";

import moment from "moment";
import { openai } from "@/app/openai";
import { functionCallHandler } from "@/app/_helpers/client/functionCallHandler";
import {
  AssistantType,
  getAssistantTools,
  getSystemInstruction,
} from "@/app/_helpers/assistant-creation-contants";
import { APIPromise } from "openai/core.mjs";
import { ChatCompletion } from "openai/resources/index.mjs";

export const maxDuration = 300;

interface WhatsAppChatHistoryType {
  _id?: ObjectId;
  userId: string;
  chatbotId: string;
  chats: {
    [key: string]: {
      messages: {
        role: string;
        content: string;
      }[];
      usage: {
        completion_tokens: number;
        prompt_tokens: number;
        total_tokens: number;
      };
    };
  };
}

const getWhatsAppDetails = async (wa_id: any) => {
  try {
    const db = (await clientPromise!).db();
    const collection = db.collection("whatsappbot_details");
    const result = await collection.findOne({
      phoneNumberID: wa_id,
      isEnabled: true,
    });
    if (result.chatbotId) {
      return result;
    }
    return null;
  } catch (error) {
    console.log("error getting chatbotID");
    return "error";
  }
};

const getResponseNumber = (res: any) => {
  return res?.entry?.[0]?.changes?.[0]?.value?.contacts[0]?.wa_id;
};

//-----------------------------------------------------------This function will send message to whatsapp
async function sendMessageToWhatsapp(
  phoneNumberId: any,
  recipientPhoneNumber: any,
  accessToken: any,
  message: any
) {
  const version = "v18.0"; // Replace with your desired version

  // Define the URL for the POST request
  const url = `https://graph.facebook.com/${version}/${phoneNumberId}/messages`;

  // Define the data to be sent in the request body
  const data = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: `${recipientPhoneNumber}`,
    type: "text",
    text: {
      preview_url: false,
      body: message,
    },
  };

  // Define the options for the fetch request
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(data),
  };
  // Make the POST request using fetch
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      const responseText = await response.text();
      console.log(
        "Error while sending message to whatsapp >>>>>>>>",
        responseText
      );

      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    // Handle the data as needed
  } catch (error) {
    // Handle the error as needed
    console.log("whatsapp sending message error \n", error);
  }
}

export async function GET(req: NextRequest) {
  let hubMode = req.nextUrl.searchParams.get("hub.mode");
  let hubChallenge = req.nextUrl.searchParams.get("hub.challenge");
  let hubToken = req.nextUrl.searchParams.get("hub.verify_token");

  const db = (await clientPromise!).db();
  const collection = db?.collection("whatsappbot_details");
  //find the token in database
  const tokenDetails = await collection?.findOne({
    webhook_verification_token: hubToken,
  });
  if (
    hubMode === "subscribe" &&
    hubToken === tokenDetails?.webhook_verification_token
    // hubToken === process.env.WHATSAPPCALLBACKTOKEN
  ) {
    // find whome the hubToken belongs to and update the isTokenVerified to true
    const tokenDetails = await collection?.findOne({
      webhook_verification_token: hubToken,
    });
    if (tokenDetails) {
      await collection?.updateOne(
        { webhook_verification_token: hubToken },
        { $set: { isTokenVerified: true } }
      );
    }

    console.log("verified successfully");
    return new Response(hubChallenge);
  }
  console.log("->>>>>>>>>>>>>>>>>>");
  return new Response("Invalid Credentials", { status: 400 });
}

// WhatsApp will triger this post request once user asked question to bot and also response to the user
export async function POST(req: NextRequest) {
  let res: any = await req.json();

  try {
    let questionFromWhatsapp =
      res?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.text?.body; // question received from whatsapp
    new Response("received", { status: 200 });

    if (questionFromWhatsapp === "this is a text message") {
      return new Response("received", { status: 200 });
    }
    if (
      questionFromWhatsapp == undefined ||
      questionFromWhatsapp.trim().length <= 0
    ) {
      //if the request is only about status don't move further
      // return NextResponse.json({ message: "received" });
      return new Response("received", { status: 200 });
    }

    await whatsAppOperation(res);
    return new Response("received", { status: 200 });
  } catch (error: any) {
    console.log("error at step", error);
  }
}

/// tool call handler
async function toolCallHandler(
  responseOpenAI: any,
  chatbotId: any,
  userId: any
) {
  const toolCalls: any = responseOpenAI.choices[0].message.tool_calls;

  // loop over tool calls and call function handler
  const toolCallOutputs: any = await Promise.all(
    toolCalls.map(async (toolCall: any) => {
      // Call the function
      const result = await functionCallHandler(toolCall, chatbotId, userId, []);
      return {
        output: result,
        tool_call_id: toolCall.id,
        name: toolCall?.function?.name,
      };
    })
  );

  return toolCallOutputs;
}

/// stop reason handler
async function stopReasonHandler(openaiBody: any, userID: any, db: any) {
  //--------update message count if we have response from openai
  //update message count and check message limit

  const collections = db?.collection("user-details");
  const result = await collections.findOne({ userId: userID });
  if (
    result?.totalMessageCount !== undefined &&
    openaiBody.choices[0].message.content
  ) {
    // If totalMessageCount exists, update it by adding 1
    await collections.updateOne(
      { userId: userID },
      { $set: { totalMessageCount: result.totalMessageCount + 1 } }
    );
  }
}

/// store the chat history
async function storeChatHistory(
  userChatHistoryCollection: any,
  userID: any,
  chatbotId: any,
  userPhoneNumber: any,
  questionFromWhatsapp: any,
  openaiBody: any,
  instructionTokenLength: any,
  messages: any
) {
  //stores chat history
  await userChatHistoryCollection.insertOne({
    userId: userID,
    chatbotId: chatbotId,
    chats: {
      [`${userPhoneNumber}`]: {
        messages: messages,
        usage: {
          completion_tokens: openaiBody.usage.completion_tokens,
          prompt_tokens:
            openaiBody.usage.prompt_tokens - instructionTokenLength,
          total_tokens: openaiBody.usage.total_tokens - instructionTokenLength,
        },
      },
    },
    date: moment().utc().format("YYYY-MM-DD"),
  });
}

/// get openai response
async function getOpenAIResponse(
  userChatBotModel: any,
  conversationMessages: any,
  questionFromWhatsapp: any,
  systemInstruction: any,
  tools: any
) {
  // Fetch the response from the OpenAI API
  const responseOpenAI = await openai.chat.completions.create({
    model: userChatBotModel.model,
    temperature: userChatBotModel?.temperature ?? 0,
    top_p: 1,
    messages: [
      {
        role: "system",
        content: `${systemInstruction}`,
      },
      ...conversationMessages,
      {
        role: "user",
        content: `query: ${questionFromWhatsapp} `,
      },
    ],
    tools: tools,
  });

  return responseOpenAI;
}

async function whatsAppOperation(res: any) {
  const tokenLimit: any = {
    "gpt-3.5-turbo": 15385,
    "gpt-4": 8000,
    "gpt-4o": 16000,
  };

  let step = 1;

  try {
    let questionFromWhatsapp =
      res?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.text?.body; // question received from whatsapp

    const binessAccountNumber =
      res?.entry?.[0]?.changes?.[0]?.value?.metadata["phone_number_id"];

    // -----------------------------------------------------This function will if the subscription is active or not of user

    step = 2;
    let whatsAppDetailsResult: any = await getWhatsAppDetails(
      binessAccountNumber
    ); //here you will recieved the chatbot unique id, based on this you would identify knowledge base

    const userPhoneNumber = getResponseNumber(res); //user phone number

    const db = (await clientPromise!).db();
    const userChatBotcollections = db.collection("user-chatbots");
    const userChatBotResult = await userChatBotcollections.findOne({
      chatbotId: whatsAppDetailsResult.chatbotId,
    });

    step = 3;
    const userCollection = db?.collection("users");
    const data = await userCollection.findOne({
      _id: new ObjectId(userChatBotResult.userId),
    });
    const endDate = data?.endDate;
    // const isTelegram = data?.isWhatsapp;

    const currentDate = new Date();
    if (currentDate > endDate) {
      step = 4;
      await sendMessageToWhatsapp(
        whatsAppDetailsResult.phoneNumberID,
        "+" + userPhoneNumber,
        whatsAppDetailsResult.whatsAppAccessToken,
        "Your subscription has ended"
      );
      return new Response("received", { status: 200 });
    } else {
      console.log("continue..");
    }

    step = 5;
    if (whatsAppDetailsResult.isEnabled === false) {
      // return { message: "Chatbot with WhatsApp is disabled" };
      console.log("Chatbot with WhatsApp is disabled ");
      // return NextResponse.json({ message: "received" });
      return new Response("received", { status: 200 });
    }

    if (!whatsAppDetailsResult || whatsAppDetailsResult === "error") {
      return new Response("received", { status: 200 });
    }

    const userID = userChatBotResult.userId;

    step = 6;
    const userDetailsCollection = db?.collection("user-details");
    const userDetailsResult = await userDetailsCollection.findOne({
      userId: userID,
    });

    if (userDetailsResult.totalMessageCount >= userDetailsResult.messageLimit) {
      await sendMessageToWhatsapp(
        whatsAppDetailsResult.phoneNumberID,
        "+" + userPhoneNumber,
        whatsAppDetailsResult.whatsAppAccessToken,
        "Your limit reached please upgrade your plan"
      );
      return new Response("received", { status: 200 });
    }

    step = 7;
    //get the user's chatbot history
    let userChatHistoryCollection = db.collection("whatsapp-chat-history");
    let userChatHistory: WhatsAppChatHistoryType =
      await userChatHistoryCollection.findOne({
        userId: userID,
        date: moment().utc().format("YYYY-MM-DD"),
      });

    //get the user's chatbot setting
    let userChatBotSetting = db.collection("chatbot-settings");

    //find the user's chatbot model
    let userChatBotModel = await userChatBotSetting.findOne({
      userId: userID,
    });

    step = 8;
    // if we have user id
    // const response: any = await fetch(
    //   `${process.env.NEXT_PUBLIC_WEBSITE_URL}api/pinecone`,
    //   {
    //     method: "POST",
    //     body: JSON.stringify({
    //       userQuery: questionFromWhatsapp,
    //       chatbotId: whatsAppDetailsResult.chatbotId,
    //       userId: userID,
    //       messages: !userChatHistory
    //         ? []
    //         : userChatHistory.chats[`${userPhoneNumber}`].messages,
    //     }),
    //   }
    // );

    /// parse the response and extract the similarity results
    // const similaritySearchResults = await response.text();
    // let similaritySearchResults = JSON.parse(respText).join("\n");

    step = 9;
    const tools = getAssistantTools(AssistantType.SALES_AGENT_SHOPIFY);
    const systemInstruction = `
        Greet customers warmly and engage in a brief conversation to understand their needs before assisting with product recommendations on Shopify, but modify responses to align with WhatsApp guidelines instead of HTML format.

        Utilize the following functions effectively:

        - **"find_product"**: Search for specific products based on customer inquiries.
        - **"get_customer_orders"**: Retrieve customer order history using their email to refine suggestions.
        - **"get_products"**: Access a comprehensive list of products to offer additional options.
        - **"get_reference"**: Use to address queries not related to the functions above.

        Responses should be provided in a casual, conversational format suitable for WhatsApp, avoiding complex formatting and focusing instead on simple, direct messaging, with product descriptions and images where appropriate.

        # Steps

        1. Welcome the customer warmly and initiate a conversation to personalize the experience.
        2. Analyze their inquiry to determine the most appropriate means of assisting them.
        3. Use the "find_product" function to locate relevant items.
        4. Retrieve past purchases through "get_customer_orders" using the customer’s email to ensure tailored recommendations.
        5. Use "get_products" to offer additional options related to their inquiry.
        6. Respond to unrelated questions using the "get_reference" function.
        7. Keep the language casual and friendly, suitable for WhatsApp, by using bullet points, emojis, and simple text to improve customer engagement.
        8. Include text descriptions for products along with their image links as URLs (since images can't render directly in WhatsApp).

        # Output Format

        - **Text-only format** suitable for WhatsApp, written in a conversational tone.
        - **Bullet points** to display multiple product options.
        - Include product image URLs with descriptions, like: "Product Name - [Image URL]".
        - Concise and friendly language, ensuring messages are easy to read and follow.
        - Use emojis when appropriate to make the message more engaging.

        # Examples

        **Example Start**

        **Input:**
        Customer asks about vegan skincare products.

        **Output:**

        Hello there 😊! It's great to help you today. You mentioned you're looking for vegan skincare products? Here are a few amazing options I recommend:

        - *Vegan Cleanser* - Gentle on your skin and 100% plant-based 🌿
          👉 [Find the Vegan Cleanser here: https://example.com/cleanser.jpg]

        - *Vegan Moisturizer* - Keeps your skin hydrated and feeling fabulous 🧴
          👉 [Check out the Vegan Moisturizer here: https://example.com/moisturizer.jpg]

        Feel free to take a look and let me know if you need more options or if you have any particular preferences!

        **Example End**

        # Notes

        - Always tailor recommendations based on user preferences and, when possible, past purchase history for a personal touch.
        - Use emojis thoughtfully to add a friendly feel but never overdo it.
        - Keep messages simple and direct, following WhatsApp guidelines: no complex formatting and no excessive information in a single response.
        - Images cannot be included directly; therefore, provide customers with direct links to product images or pages.
        - Maintain a tone that is helpful, cheerful, and personable to ensure users have an enjoyable shopping experience.
    `;
    //if user chat history is not available, create a new chat history
    if (!userChatHistory) {
      /// get the response from openai
      const responseOpenAI = await getOpenAIResponse(
        userChatBotModel,
        [],
        questionFromWhatsapp,
        systemInstruction,
        tools
      );

      /// check if the finish reason is simple message to send the message to user or a function call
      let openaiBody: any;
      let instructionTokenLength = encode(userChatBotModel?.instruction).length;

      if (responseOpenAI.choices[0].finish_reason === "stop") {
        openaiBody = responseOpenAI;

        //--------update message count if we have response from openai
        await stopReasonHandler(openaiBody, userID, db);

        // after getting response from open ai
        if (openaiBody.choices[0].message.content) {
          await sendMessageToWhatsapp(
            whatsAppDetailsResult.phoneNumberID,
            "+" + userPhoneNumber,
            whatsAppDetailsResult.whatsAppAccessToken,
            openaiBody.choices[0].message.content
          );

          // let similarSearchToken = encode(similaritySearchResults).length;

          step = 10;
          //stores chat history
          // await userChatHistoryCollection.insertOne({
          //   userId: userID,
          //   chatbotId: whatsAppDetailsResult.chatbotId,
          //   chats: {
          //     [`${userPhoneNumber}`]: {
          //       messages: [
          //         {
          //           role: "user",
          //           content: `${questionFromWhatsapp}`,
          //         },
          //         {
          //           role: "assistant",
          //           content: openaiBody.choices[0].message.content,
          //         },
          //       ],
          //       usage: {
          //         completion_tokens: openaiBody.usage.completion_tokens,
          //         prompt_tokens:
          //           openaiBody.usage.prompt_tokens - instructionTokenLength,
          //         total_tokens:
          //           openaiBody.usage.total_tokens - instructionTokenLength,
          //       },
          //     },
          //   },
          //   date: moment().utc().format("YYYY-MM-DD"),
          // });

          const messages = [
            {
              role: "user",
              content: `${questionFromWhatsapp} `,
            },
            responseOpenAI.choices[0].message,
          ];

          await storeChatHistory(
            userChatHistoryCollection,
            userID,
            whatsAppDetailsResult.chatbotId,
            userPhoneNumber,
            questionFromWhatsapp,
            openaiBody,
            instructionTokenLength,
            messages
          );

          //return response
          // return new Response("received", { status: 200 });
        }
      } else if (responseOpenAI.choices[0].finish_reason === "tool_calls") {
        /// call the tool call handler to handle actions
        const toolCallOutputs: any = await toolCallHandler(
          responseOpenAI,
          whatsAppDetailsResult.chatbotId,
          userID
        );

        const messages = [
          {
            role: "user",
            content: `${questionFromWhatsapp} `,
          },
          responseOpenAI.choices[0].message,
          ...toolCallOutputs.map((output: any) => ({
            role: "tool",
            content: output.output,
            name: output.name,
            tool_call_id: output.tool_call_id,
          })),
        ];

        // Send the outputs back to OpenAI
        const fucntionCallCompletion = await openai.chat.completions.create({
          model: userChatBotModel.model,
          temperature: userChatBotModel?.temperature ?? 0,
          top_p: 1,
          messages: [
            {
              role: "system",
              content: `${systemInstruction}`,
            },
            ...messages,
          ],
          tools: tools,
        });

        console.log(
          "completion after calling tools",
          fucntionCallCompletion.usage,
          instructionTokenLength
        );

        //update message count and check message limit
        const result = await userDetailsCollection.findOne({ userId: userID });
        if (
          result?.totalMessageCount !== undefined &&
          fucntionCallCompletion.choices[0].message.content
        ) {
          // If totalMessageCount exists, update it by adding 1
          await userDetailsCollection.updateOne(
            { userId: userID },
            { $set: { totalMessageCount: result.totalMessageCount + 1 } }
          );
        }

        // after getting response from open ai
        if (fucntionCallCompletion.choices[0].message.content) {
          await sendMessageToWhatsapp(
            whatsAppDetailsResult.phoneNumberID,
            "+" + userPhoneNumber,
            whatsAppDetailsResult.whatsAppAccessToken,
            fucntionCallCompletion.choices[0].message.content
          );

          /// store the chat history
          await storeChatHistory(
            userChatHistoryCollection,
            userID,
            whatsAppDetailsResult.chatbotId,
            userPhoneNumber,
            questionFromWhatsapp,
            fucntionCallCompletion,
            instructionTokenLength,
            messages
          );
        }
      }
    }
    //when user chat history is available
    else {
      step = 11;
      //calculate the total tokens based on user message
      let previousTotalTokens = 0;
      // let similarSearchToken = encode(similaritySearchResults).length;
      let instructionTokenLength = encode(userChatBotModel?.instruction).length;
      let conversationMessages: any = [];
      let currentQuestionsTotalTokens: any =
        encode(questionFromWhatsapp).length;
      // let totalTokens = previousTotalTokens + currentQuestionsTotalTokens[1];

      //if xyz user's based on number, chat history is available
      if (userChatHistory.chats[`${userPhoneNumber}`]) {
        previousTotalTokens = userChatHistory.chats[`${userPhoneNumber}`].usage
          .total_tokens as number;
        let totalCountedToken =
          previousTotalTokens + currentQuestionsTotalTokens;
        conversationMessages =
          userChatHistory.chats[`${userPhoneNumber}`].messages;

        /// remove messages from the array to avoid context window limit
        if (totalCountedToken >= tokenLimit[userChatBotModel.model]) {
          let tokensToRemove =
            totalCountedToken - tokenLimit[userChatBotModel.model];
          let index = 0;
          let tokens = 0;

          // Find the index where the sum of tokens reaches the limit
          while (
            tokens < tokensToRemove &&
            index < conversationMessages.length
          ) {
            tokens += calculateTokens(conversationMessages[index]);
            index++;
          }

          // Remove the messages from the start of the array up to the found index
          conversationMessages.splice(0, index);
        }

        // if (
        //   tokenLimit[0]["model"] == userChatBotModel.model &&
        //   totalCountedToken >= tokenLimit[0].tokens
        // ) {
        //   //approach 2
        //   let tokensToRemove = totalCountedToken - tokenLimit[0].tokens;
        //   let index = 0;
        //   let tokens = 0;

        //   // Find the index where the sum of tokens reaches the limit
        //   while (
        //     tokens < tokensToRemove &&
        //     index < conversationMessages.length
        //   ) {
        //     tokens += calculateTokens(conversationMessages[index]);
        //     index++;
        //   }

        //   // Remove the messages from the start of the array up to the found index
        //   conversationMessages.splice(0, index);
        //   // totalCountedToken -= tokens;
        // } else if (
        //   tokenLimit[1]["model"] == userChatBotModel.model &&
        //   totalCountedToken >= tokenLimit[1].tokens
        // ) {
        //   // const removeCount = Math.floor(conversationMessages.length / 3); // Calculate one-third of the array length
        //   // conversationMessages.splice(0, removeCount); // Remove one-third of the messages from the start of the array
        //   let tokensToRemove = totalCountedToken - tokenLimit[1].tokens;
        //   let index = 0;
        //   let tokens = 0;

        //   // Find the index where the sum of tokens reaches the limit
        //   while (
        //     tokens < tokensToRemove &&
        //     index < conversationMessages.length
        //   ) {
        //     tokens += calculateTokens(conversationMessages[index]);
        //     index++;
        //   }

        //   // Remove the messages from the start of the array up to the found index
        //   conversationMessages.splice(0, index);
        //   // totalCountedToken -= tokens;
        // } else if (
        //   tokenLimit[2]["model"] == userChatBotModel.model &&
        //   totalCountedToken >= tokenLimit[2].tokens
        // ) {
        //   // const removeCount = Math.floor(conversationMessages.length / 3); // Calculate one-third of the array length
        //   // conversationMessages.splice(0, removeCount); // Remove one-third of the messages from the start of the array
        //   let tokensToRemove = totalCountedToken - tokenLimit[2].tokens;
        //   let index = 0;
        //   let tokens = 0;

        //   // Find the index where the sum of tokens reaches the limit
        //   while (
        //     tokens < tokensToRemove &&
        //     index < conversationMessages.length
        //   ) {
        //     tokens += calculateTokens(conversationMessages[index]);
        //     index++;
        //   }

        //   // Remove the messages from the start of the array up to the found index
        //   conversationMessages.splice(0, index);
        //   // totalCountedToken -= tokens;
        // }
      }
      step = 12;
      /// get the response from openai
      const responseOpenAI = await getOpenAIResponse(
        userChatBotModel,
        conversationMessages,
        questionFromWhatsapp,
        systemInstruction,
        tools
      );

      //parse the response to json
      let openaiBody: any;
      console.log("responseOpenAI with chathistory", responseOpenAI.choices[0]);

      const collections = db?.collection("user-details");
      if (responseOpenAI.choices[0].finish_reason === "stop") {
        openaiBody = responseOpenAI;

        //--------update message count if we have response from openai
        await stopReasonHandler(openaiBody, userID, db);

        // after getting response from open ai
        if (openaiBody.choices[0].message.content) {
          await sendMessageToWhatsapp(
            whatsAppDetailsResult.phoneNumberID,
            "+" + userPhoneNumber,
            whatsAppDetailsResult.whatsAppAccessToken,
            openaiBody.choices[0].message.content
          );

          step = 13;
          //update the chat history
          //check if chat history has userPhoneNumber's chat history
          if (!userChatHistory.chats[`${userPhoneNumber}`]) {
            //if userPhoneNumber's chat history is not available, add that to the chat history
            userChatHistory.chats[`${userPhoneNumber}`] = {
              messages: [
                {
                  role: "user",
                  content: `${questionFromWhatsapp}`,
                },
                {
                  role: "assistant",
                  content: openaiBody.choices[0].message.content,
                },
              ],
              usage: {
                completion_tokens: openaiBody.usage.completion_tokens,
                prompt_tokens:
                  openaiBody.usage.prompt_tokens - instructionTokenLength,
                total_tokens:
                  openaiBody.usage.total_tokens - instructionTokenLength,
              },
            };

            //update the chat history
            await userChatHistoryCollection.updateOne(
              { userId: userID, date: moment().utc().format("YYYY-MM-DD") },
              {
                $set: {
                  chats: userChatHistory.chats,
                },
              }
            );

            //return resonse
            // return new Response("received", { status: 200 });
          } else {
            //if chat history found, update the chat history
            step = 14;

            //update the chat history
            userChatHistory.chats[`${userPhoneNumber}`].messages.push(
              {
                role: "user",
                content: `${questionFromWhatsapp}`,
              },
              {
                role: "assistant",
                content: openaiBody.choices[0].message.content,
              }
            );

            //total tokens addition
            let oldTotalTokens =
              userChatHistory.chats[`${userPhoneNumber}`].usage.total_tokens;
            let userEnterToken = currentQuestionsTotalTokens;
            let openAICompletionToken = openaiBody.usage.completion_tokens;
            oldTotalTokens += userEnterToken + openAICompletionToken;

            //prompt tokens addition
            let oldPromptTokens =
              userChatHistory.chats[`${userPhoneNumber}`].usage.prompt_tokens;
            oldPromptTokens += currentQuestionsTotalTokens;

            //add the new to previoius tokens
            userChatHistory.chats[`${userPhoneNumber}`].usage = {
              completion_tokens: openaiBody.usage.completion_tokens,
              prompt_tokens: oldPromptTokens,
              total_tokens: oldTotalTokens,
            };

            //update the chat history
            await userChatHistoryCollection.updateOne(
              { userId: userID, date: moment().utc().format("YYYY-MM-DD") },
              {
                $set: {
                  chats: userChatHistory.chats,
                },
              }
            );

            //return response
            // return new Response("received", { status: 200 });
          }
        }
      } else if (responseOpenAI.choices[0].finish_reason === "tool_calls") {
        /// call the tool call handler to handle actions
        const toolCallOutputs: any = await toolCallHandler(
          responseOpenAI,
          whatsAppDetailsResult.chatbotId,
          userID
        );

        const messages = [
          {
            role: "user",
            content: `${questionFromWhatsapp} `,
          },
          responseOpenAI.choices[0].message,
          ...toolCallOutputs.map((output: any) => ({
            role: "tool",
            content: output.output,
            name: output.name,
            tool_call_id: output.tool_call_id,
          })),
        ];

        // Send the outputs back to OpenAI
        const fucntionCallCompletion: any =
          await openai.chat.completions.create({
            model: userChatBotModel.model,
            temperature: userChatBotModel?.temperature ?? 0,
            top_p: 1,

            messages: [
              {
                role: "system",
                content: `${systemInstruction}`,
              },
              ...messages,
            ],

            tools: tools,
          });

        console.log(
          "completion after calling tools with chat historu",
          fucntionCallCompletion.choices[0].message
        );

        //update message count and check message limit
        const result = await collections.findOne({ userId: userID });
        if (
          result?.totalMessageCount !== undefined &&
          fucntionCallCompletion.choices[0].message.content
        ) {
          // If totalMessageCount exists, update it by adding 1
          await collections.updateOne(
            { userId: userID },
            { $set: { totalMessageCount: result.totalMessageCount + 1 } }
          );
        }

        // after getting response from open ai
        if (fucntionCallCompletion.choices[0].message.content) {
          await sendMessageToWhatsapp(
            whatsAppDetailsResult.phoneNumberID,
            "+" + userPhoneNumber,
            whatsAppDetailsResult.whatsAppAccessToken,
            fucntionCallCompletion.choices[0].message.content
          );

          step = 13;
          //update the chat history
          //check if chat history has userPhoneNumber's chat history
          if (!userChatHistory.chats[`${userPhoneNumber}`]) {
            //if userPhoneNumber's chat history is not available, add that to the chat history
            userChatHistory.chats[`${userPhoneNumber}`] = {
              messages: [
                {
                  role: "user",
                  content: `${questionFromWhatsapp}`,
                },
                {
                  role: "assistant",
                  content: fucntionCallCompletion.choices[0].message.content,
                },
              ],
              usage: {
                completion_tokens:
                  fucntionCallCompletion.usage?.completion_tokens,
                prompt_tokens:
                  fucntionCallCompletion.usage?.prompt_tokens -
                  instructionTokenLength,
                total_tokens:
                  fucntionCallCompletion.usage.total_tokens -
                  instructionTokenLength,
              },
            };

            //update the chat history
            await userChatHistoryCollection.updateOne(
              { userId: userID, date: moment().utc().format("YYYY-MM-DD") },
              {
                $set: {
                  chats: userChatHistory.chats,
                },
              }
            );

            //return resonse
            // return new Response("received", { status: 200 });
          } else {
            //if chat history found, update the chat history

            step = 14;

            //update the chat history
            userChatHistory.chats[`${userPhoneNumber}`].messages.push(
              {
                role: "user",
                content: `${questionFromWhatsapp}`,
              },
              {
                role: "assistant",
                content: fucntionCallCompletion.choices[0].message.content,
              }
            );

            //total tokens addition
            let oldTotalTokens =
              userChatHistory.chats[`${userPhoneNumber}`].usage.total_tokens;
            let userEnterToken = currentQuestionsTotalTokens;
            let openAICompletionToken =
              fucntionCallCompletion.usage.completion_tokens;
            oldTotalTokens += userEnterToken + openAICompletionToken;

            //prompt tokens addition
            let oldPromptTokens =
              userChatHistory.chats[`${userPhoneNumber}`].usage.prompt_tokens;
            oldPromptTokens += currentQuestionsTotalTokens;

            //add the new to previoius tokens
            userChatHistory.chats[`${userPhoneNumber}`].usage = {
              completion_tokens: fucntionCallCompletion.usage.completion_tokens,
              prompt_tokens: oldPromptTokens,
              total_tokens: oldTotalTokens,
            };

            //update the chat history
            await userChatHistoryCollection.updateOne(
              { userId: userID, date: moment().utc().format("YYYY-MM-DD") },
              {
                $set: {
                  chats: userChatHistory.chats,
                },
              }
            );

            //return response
            // return new Response("received", { status: 200 });
          }
        }
      }
    }
  } catch (error: any) {
    console.log("error at step", step);
    console.log("error", error);
  }
}

function calculateTokens(conversationMessages: {
  role: string;
  content: string;
  tool_call_id?: string;
  tool_calls?: any;
  refusal?: any;
}) {
  const token = encode(conversationMessages.content).length;
  return token;
}
