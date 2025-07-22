// import { NextRequest, NextResponse } from "next/server";

// import clientPromise from "@/db";
// import { ObjectId } from "mongodb";
// import { encodeChat, encode, decode, isWithinTokenLimit } from "gpt-tokenizer";

// import moment from "moment";

// export const maxDuration = 300;

// interface WhatsAppChatHistoryType {
//   _id?: ObjectId;
//   userId: string;
//   chatbotId: string;
//   chats: {
//     [key: string]: {
//       messages: {
//         role: string;
//         content: string;
//       }[];
//       usage: {
//         completion_tokens: number;
//         prompt_tokens: number;
//         total_tokens: number;
//       };
//     };
//   };
// }

// const getWhatsAppDetails = async (wa_id: any) => {
//   try {
//     const db = (await clientPromise!).db();
//     const collection = db.collection("whatsappbot_details");
//     const result = await collection.findOne({
//       phoneNumberID: wa_id,
//       isEnabled: true,
//     });
//     if (result.chatbotId) {
//       return result;
//     }
//     return null;
//   } catch (error) {
//     console.log("error getting chatbotID");
//     return "error";
//   }
// };

// const getResponseNumber = (res: any) => {
//   return res?.entry?.[0]?.changes?.[0]?.value?.contacts[0]?.wa_id;
// };

// //-----------------------------------------------------------This function will send message to whatsapp
// async function sendMessageToWhatsapp(
//   phoneNumberId: any,
//   recipientPhoneNumber: any,
//   accessToken: any,
//   message: any
// ) {
//   const version = "v18.0"; // Replace with your desired version

//   // Define the URL for the POST request
//   const url = `https://graph.facebook.com/${version}/${phoneNumberId}/messages`;

//   // Define the data to be sent in the request body
//   const data = {
//     messaging_product: "whatsapp",
//     recipient_type: "individual",
//     to: `${recipientPhoneNumber}`,
//     type: "text",
//     text: {
//       preview_url: false,
//       body: message,
//     },
//   };

//   // Define the options for the fetch request
//   const options = {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${accessToken}`,
//     },
//     body: JSON.stringify(data),
//   };
//   // Make the POST request using fetch
//   try {
//     const response = await fetch(url, options);

//     if (!response.ok) {
//       throw new Error(`HTTP error! Status: ${response.status}`);
//     }

//     // Handle the data as needed
//   } catch (error) {
//     // Handle the error as needed
//     console.log("whatsapp sending message error \n", error);
//   }
// }

// export async function GET(req: NextRequest) {
//   let hubMode = req.nextUrl.searchParams.get("hub.mode");
//   let hubChallenge = req.nextUrl.searchParams.get("hub.challenge");
//   let hubToken = req.nextUrl.searchParams.get("hub.verify_token");

//   const db = (await clientPromise!).db();
//   const collection = db?.collection("whatsappbot_details");
//   //find the token in database
//   const tokenDetails = await collection?.findOne({
//     webhook_verification_token: hubToken,
//   });
//   if (
//     hubMode === "subscribe" &&
//     hubToken === tokenDetails?.webhook_verification_token
//     // hubToken === process.env.WHATSAPPCALLBACKTOKEN
//   ) {
//     // find whome the hubToken belongs to and update the isTokenVerified to true
//     const tokenDetails = await collection?.findOne({
//       webhook_verification_token: hubToken,
//     });
//     if (tokenDetails) {
//       await collection?.updateOne(
//         { webhook_verification_token: hubToken },
//         { $set: { isTokenVerified: true } }
//       );
//     }

//     console.log("verified successfully");
//     return new Response(hubChallenge);
//   }
//   console.log("->>>>>>>>>>>>>>>>>>");
//   return new Response("Invalid Credentials", { status: 400 });
// }

// // WhatsApp will triger this post request once user asked question to bot and also response to the user
// export async function POST(req: NextRequest) {
//   let res: any = await req.json();

//   try {
//     let questionFromWhatsapp =
//       res?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.text?.body; // question received from whatsapp
//     new Response("received", { status: 200 });

//     if (questionFromWhatsapp === "this is a text message") {
//       return new Response("received", { status: 200 });
//     }
//     if (
//       questionFromWhatsapp == undefined ||
//       questionFromWhatsapp.trim().length <= 0
//     ) {
//       //if the request is only about status don't move further
//       // return NextResponse.json({ message: "received" });
//       return new Response("received", { status: 200 });
//     }

//     await whatsAppOperation(res);
//     return new Response("received", { status: 200 });
//   } catch (error: any) {
//     console.log("error at step", error);
//   }
// }

// async function whatsAppOperation(res: any) {
//   const tokenLimit = [
//     {
//       model: "gpt-3.5-turbo",
//       tokens: 15385,
//     },
//     {
//       model: "gpt-4",
//       tokens: 8000,
//     },
//     {
//       model: "gpt-4o",
//       tokens: 16000,
//     },
//   ];

//   let step = 1;

//   try {
//     let questionFromWhatsapp =
//       res?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.text?.body; // question received from whatsapp

//     const binessAccountNumber =
//       res?.entry?.[0]?.changes?.[0]?.value?.metadata["phone_number_id"];

//     // -----------------------------------------------------This function will if the subscription is active or not of user

//     step = 2;
//     let whatsAppDetailsResult: any = await getWhatsAppDetails(
//       binessAccountNumber
//     ); //here you will recieved the chatbot unique id, based on this you would identify knowledge base
//     const userPhoneNumber = getResponseNumber(res); //user phone number
//     const db = (await clientPromise!).db();
//     const userChatBotcollections = db.collection("user-chatbots");
//     const userChatBotResult = await userChatBotcollections.findOne({
//       chatbotId: whatsAppDetailsResult.chatbotId,
//     });

//     step = 3;
//     const userCollection = db?.collection("users");
//     const data = await userCollection.findOne({
//       _id: new ObjectId(userChatBotResult.userId),
//     });
//     const endDate = data?.endDate;
//     // const isTelegram = data?.isWhatsapp;

//     const currentDate = new Date();
//     if (currentDate > endDate) {
//       step = 4;
//       await sendMessageToWhatsapp(
//         whatsAppDetailsResult.phoneNumberID,
//         "+" + userPhoneNumber,
//         whatsAppDetailsResult.whatsAppAccessToken,
//         "Your subscription has ended"
//       );
//       return new Response("received", { status: 200 });
//     } else {
//       console.log("continue..");
//     }

//     step = 5;
//     if (whatsAppDetailsResult.isEnabled === false) {
//       // return { message: "Chatbot with WhatsApp is disabled" };
//       console.log("Chatbot with WhatsApp is disabled ");
//       // return NextResponse.json({ message: "received" });
//       return new Response("received", { status: 200 });
//     }

//     if (!whatsAppDetailsResult || whatsAppDetailsResult === "error") {
//       return new Response("received", { status: 200 });
//       ``;
//     }

//     const userID = userChatBotResult.userId;

//     //check whether limit is reached or not
//     const version = "v18.0"; // Replace with your desired version
//     // const phoneNumberId = process.env.WHATSAPPPHONENUMBERID; // Replace with your phone number ID
//     const phoneNumberId = whatsAppDetailsResult.phoneNumberID;
//     const recipientPhoneNumber = "+" + userPhoneNumber;
//     // const accessToken = process.env.WHATSAPPTOKEN
//     const accessToken = whatsAppDetailsResult.whatsAppAccessToken;

//     step = 6;
//     const userDetailsCollection = db?.collection("user-details");
//     const userDetailsResult = await userDetailsCollection.findOne({
//       userId: userID,
//     });
//     if (userDetailsResult.totalMessageCount >= userDetailsResult.messageLimit) {
//       await sendMessageToWhatsapp(
//         whatsAppDetailsResult.phoneNumberID,
//         "+" + userPhoneNumber,
//         whatsAppDetailsResult.whatsAppAccessToken,
//         "Your limit reached please upgrade your plan"
//       );
//       return new Response("received", { status: 200 });
//     }

//     step = 7;
//     // if we have user id
//     const response: any = await fetch(
//       `${process.env.NEXT_PUBLIC_WEBSITE_URL}api/pinecone`,
//       {
//         method: "POST",
//         body: JSON.stringify({
//           userQuery: questionFromWhatsapp,
//           chatbotId: whatsAppDetailsResult.chatbotId,
//           userId: userID,
//         }),
//       }
//     );

//     /// parse the response and extract the similarity results
//     const respText = await response.text();
//     let similaritySearchResults = respText;

//     step = 8;
//     //get the user's chatbot history
//     let userChatHistoryCollection = db.collection("whatsapp-chat-history");
//     let userChatHistory: WhatsAppChatHistoryType =
//       await userChatHistoryCollection.findOne({
//         userId: userID,
//         date: moment().utc().format("YYYY-MM-DD"),
//       });

//     //get the user's chatbot setting
//     let userChatBotSetting = db.collection("chatbot-settings");

//     //find the user's chatbot model
//     let userChatBotModel = await userChatBotSetting.findOne({
//       userId: userID,
//     });

//     step = 9;
//     //if user chat history is not available, create a new chat history
//     if (!userChatHistory) {
//       // Fetch the response from the OpenAI API
//       const responseOpenAI: any = await fetch(
//         "https://api.openai.com/v1/chat/completions",
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENAI_KEY}`,
//           },
//           body: JSON.stringify({
//             model: userChatBotModel.model,
//             temperature: userChatBotModel?.temperature ?? 0,
//             top_p: 1,
//             messages: [
//               {
//                 role: "system",
//                 content: `${userChatBotModel?.instruction}

//                 context:
//              ${similaritySearchResults}`,
//               },
//               // ...conversationMessages,
//               {
//                 role: "user",
//                 content: `
//                   query: ${questionFromWhatsapp} `,
//               },
//             ],
//           }),
//         }
//       );

//       const openaiBody = JSON.parse(await responseOpenAI.text());

//       //--------update message count if we have response from openai
//       //update message count and check message limit

//       const collections = db?.collection("user-details");
//       const result = await collections.findOne({ userId: userID });
//       if (
//         result?.totalMessageCount !== undefined &&
//         openaiBody.choices[0].message.content
//       ) {
//         // If totalMessageCount exists, update it by adding 1
//         await collections.updateOne(
//           { userId: userID },
//           { $set: { totalMessageCount: result.totalMessageCount + 1 } }
//         );
//       }

//       // after getting response from open ai
//       if (openaiBody.choices[0].message.content) {
//         await sendMessageToWhatsapp(
//           whatsAppDetailsResult.phoneNumberID,
//           "+" + userPhoneNumber,
//           whatsAppDetailsResult.whatsAppAccessToken,
//           openaiBody.choices[0].message.content
//         );

//         let similarSearchToken = encode(similaritySearchResults).length;
//         let instructionTokenLength = encode(
//           userChatBotModel?.instruction
//         ).length;
//         step = 10;
//         //stores chat history
//         await userChatHistoryCollection.insertOne({
//           userId: userID,
//           chatbotId: whatsAppDetailsResult.chatbotId,
//           chats: {
//             [`${userPhoneNumber}`]: {
//               messages: [
//                 {
//                   role: "user",
//                   content: `${questionFromWhatsapp}`,
//                 },
//                 {
//                   role: "assistant",
//                   content: openaiBody.choices[0].message.content,
//                 },
//               ],
//               usage: {
//                 completion_tokens: openaiBody.usage.completion_tokens,
//                 prompt_tokens:
//                   openaiBody.usage.prompt_tokens -
//                   instructionTokenLength -
//                   similarSearchToken,
//                 total_tokens:
//                   openaiBody.usage.total_tokens -
//                   instructionTokenLength -
//                   similarSearchToken,
//               },
//             },
//           },
//           date: moment().utc().format("YYYY-MM-DD"),
//         });

//         //return response
//         // return new Response("received", { status: 200 });
//       }
//     }
//     //when user chat history is available
//     else {
//       step = 11;
//       //calculate the total tokens based on user message
//       let previousTotalTokens = 0;
//       let similarSearchToken = encode(similaritySearchResults).length;
//       let instructionTokenLength = encode(userChatBotModel?.instruction).length;
//       let conversationMessages: any = [];
//       let currentQuestionsTotalTokens: any =
//         encode(questionFromWhatsapp).length;
//       // let totalTokens = previousTotalTokens + currentQuestionsTotalTokens[1];

//       //if xyz user's based on number, chat history is available
//       if (userChatHistory.chats[`${userPhoneNumber}`]) {
//         previousTotalTokens = userChatHistory.chats[`${userPhoneNumber}`].usage
//           .total_tokens as number;
//         let totalCountedToken =
//           previousTotalTokens +
//           currentQuestionsTotalTokens +
//           similarSearchToken;
//         conversationMessages =
//           userChatHistory.chats[`${userPhoneNumber}`].messages;

//         if (
//           tokenLimit[0]["model"] == userChatBotModel.model &&
//           totalCountedToken >= tokenLimit[0].tokens
//         ) {
//           // const removeCount = Math.floor(conversationMessages.length / 3); // Calculate one-third of the array length
//           // conversationMessages.splice(0, removeCount); // Remove one-third of the messages from the start of the array

//           //approach 1
//           // while (totalCountedToken >= tokenLimit[0].tokens) {
//           //   // Assume calculateTokens is a function that calculates the tokens for a message
//           //   totalCountedToken -= calculateTokens(conversationMessages[0]);
//           //   conversationMessages.shift();
//           // }

//           //approach 2
//           let tokensToRemove = totalCountedToken - tokenLimit[0].tokens;
//           let index = 0;
//           let tokens = 0;

//           // Find the index where the sum of tokens reaches the limit
//           while (
//             tokens < tokensToRemove &&
//             index < conversationMessages.length
//           ) {
//             tokens += calculateTokens(conversationMessages[index]);
//             index++;
//           }

//           // Remove the messages from the start of the array up to the found index
//           conversationMessages.splice(0, index);
//           // totalCountedToken -= tokens;
//         } else if (
//           tokenLimit[1]["model"] == userChatBotModel.model &&
//           totalCountedToken >= tokenLimit[1].tokens
//         ) {
//           // const removeCount = Math.floor(conversationMessages.length / 3); // Calculate one-third of the array length
//           // conversationMessages.splice(0, removeCount); // Remove one-third of the messages from the start of the array
//           let tokensToRemove = totalCountedToken - tokenLimit[1].tokens;
//           let index = 0;
//           let tokens = 0;

//           // Find the index where the sum of tokens reaches the limit
//           while (
//             tokens < tokensToRemove &&
//             index < conversationMessages.length
//           ) {
//             tokens += calculateTokens(conversationMessages[index]);
//             index++;
//           }

//           // Remove the messages from the start of the array up to the found index
//           conversationMessages.splice(0, index);
//           // totalCountedToken -= tokens;
//         } else if (
//           tokenLimit[2]["model"] == userChatBotModel.model &&
//           totalCountedToken >= tokenLimit[2].tokens
//         ) {
//           // const removeCount = Math.floor(conversationMessages.length / 3); // Calculate one-third of the array length
//           // conversationMessages.splice(0, removeCount); // Remove one-third of the messages from the start of the array
//           let tokensToRemove = totalCountedToken - tokenLimit[2].tokens;
//           let index = 0;
//           let tokens = 0;

//           // Find the index where the sum of tokens reaches the limit
//           while (
//             tokens < tokensToRemove &&
//             index < conversationMessages.length
//           ) {
//             tokens += calculateTokens(conversationMessages[index]);
//             index++;
//           }

//           // Remove the messages from the start of the array up to the found index
//           conversationMessages.splice(0, index);
//           // totalCountedToken -= tokens;
//         }
//       }

//       // similaritySearchResults = "My name is rudresh"

//       step = 12;
//       // Fetch the response from the OpenAI API
//       const responseOpenAI: any = await fetch(
//         "https://api.openai.com/v1/chat/completions",
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENAI_KEY}`,
//           },
//           body: JSON.stringify({
//             model: userChatBotModel.model,
//             // model:"gpt-4",
//             temperature: userChatBotModel?.temperature ?? 0,
//             top_p: 1,
//             messages: [
//               {
//                 role: "system",
//                 content: `${userChatBotModel?.instruction}

//                 context:
//              ${similaritySearchResults}`,
//               },
//               ...conversationMessages,
//               {
//                 role: "user",
//                 content: `
//                   query: ${questionFromWhatsapp} `,
//               },
//             ],
//           }),
//         }
//       );

//       //parse the response to json
//       const openaiBody = JSON.parse(await responseOpenAI.text());

//       //--------update message count if we have response from openai
//       //update message count and check message limit
//       const collections = db?.collection("user-details");
//       const result = await collections.findOne({ userId: userID });
//       if (
//         result?.totalMessageCount !== undefined &&
//         openaiBody.choices[0].message.content
//       ) {
//         // If totalMessageCount exists, update it by adding 1
//         await collections.updateOne(
//           { userId: userID },
//           { $set: { totalMessageCount: result.totalMessageCount + 1 } }
//         );
//       }

//       // after getting response from open ai
//       if (openaiBody.choices[0].message.content) {
//         await sendMessageToWhatsapp(
//           whatsAppDetailsResult.phoneNumberID,
//           "+" + userPhoneNumber,
//           whatsAppDetailsResult.whatsAppAccessToken,
//           openaiBody.choices[0].message.content
//         );

//         step = 13;
//         //update the chat history
//         //check if chat history has userPhoneNumber's chat history
//         if (!userChatHistory.chats[`${userPhoneNumber}`]) {
//           //if userPhoneNumber's chat history is not available, add that to the chat history
//           userChatHistory.chats[`${userPhoneNumber}`] = {
//             messages: [
//               {
//                 role: "user",
//                 content: `${questionFromWhatsapp}`,
//               },
//               {
//                 role: "assistant",
//                 content: openaiBody.choices[0].message.content,
//               },
//             ],
//             usage: {
//               completion_tokens: openaiBody.usage.completion_tokens,
//               prompt_tokens:
//                 openaiBody.usage.prompt_tokens -
//                 instructionTokenLength -
//                 similarSearchToken,
//               total_tokens:
//                 openaiBody.usage.total_tokens -
//                 instructionTokenLength -
//                 similarSearchToken,
//             },
//           };

//           //update the chat history
//           await userChatHistoryCollection.updateOne(
//             { userId: userID, date: moment().utc().format("YYYY-MM-DD") },
//             {
//               $set: {
//                 chats: userChatHistory.chats,
//               },
//             }
//           );

//           //return resonse
//           // return new Response("received", { status: 200 });
//         } else {
//           //if chat history found, update the chat history

//           step = 14;

//           //update the chat history
//           userChatHistory.chats[`${userPhoneNumber}`].messages.push(
//             {
//               role: "user",
//               content: `${questionFromWhatsapp}`,
//             },
//             {
//               role: "assistant",
//               content: openaiBody.choices[0].message.content,
//             }
//           );

//           //total tokens addition
//           let oldTotalTokens =
//             userChatHistory.chats[`${userPhoneNumber}`].usage.total_tokens;
//           let userEnterToken = currentQuestionsTotalTokens;
//           let openAICompletionToken = openaiBody.usage.completion_tokens;
//           oldTotalTokens += userEnterToken + openAICompletionToken;

//           //prompt tokens addition
//           let oldPromptTokens =
//             userChatHistory.chats[`${userPhoneNumber}`].usage.prompt_tokens;
//           oldPromptTokens += currentQuestionsTotalTokens;

//           //add the new to previoius tokens
//           userChatHistory.chats[`${userPhoneNumber}`].usage = {
//             completion_tokens: openaiBody.usage.completion_tokens,
//             prompt_tokens: oldPromptTokens,
//             total_tokens: oldTotalTokens,
//           };

//           //update the chat history
//           await userChatHistoryCollection.updateOne(
//             { userId: userID, date: moment().utc().format("YYYY-MM-DD") },
//             {
//               $set: {
//                 chats: userChatHistory.chats,
//               },
//             }
//           );

//           //return response
//           // return new Response("received", { status: 200 });
//         }
//       }
//     }
//   } catch (error: any) {
//     console.log("error at step", step);
//     console.log("error", error);
//   }
// }

// function calculateTokens(conversationMessages: {
//   role: string;
//   content: string;
// }) {
//   const token = encode(conversationMessages.content).length;
//   return token;
// }

import { NextRequest, NextResponse } from "next/server";

import clientPromise from "@/db";
import { ObjectId } from "mongodb";
import { encodeChat, encode, decode, isWithinTokenLimit } from "gpt-tokenizer";

import moment from "moment";
import OpenAI from "openai";
import { functionCallHandler } from "@/app/_helpers/client/functionCallHandler";

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
      // For Assistant API
      threadId?: string;
      assistantId?: string;
    };
  };
}

// Create the OpenAI client instance
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_KEY,
  project: process.env.NEXT_PUBLIC_OPENAI_PROJ_KEY,
  organization: process.env.NEXT_PUBLIC_OPENAI_ORG_KEY,
});

// Enhanced logging utility
const logWithTimestamp = (message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  console.log(
    `[${timestamp}] ${message}`,
    data ? JSON.stringify(data, null, 2) : ""
  );
};

const logError = (message: string, error: any, step?: number) => {
  const timestamp = new Date().toISOString();
  console.error(
    `[${timestamp}] ERROR${step ? ` at step ${step}` : ""}: ${message}`,
    {
      error: error.message || error,
      stack: error.stack,
    }
  );
};

// Enhanced API call with timeout and retry
const makeAPICallWithTimeout = async (
  url: string,
  options: RequestInit,
  timeoutMs: number = 30000,
  retries: number = 2
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
    logError(
      `API call timeout after ${timeoutMs}ms`,
      new Error("Timeout"),
      undefined
    );
  }, timeoutMs);

  const enhancedOptions = {
    ...options,
    signal: controller.signal,
  };

  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      logWithTimestamp(`API call attempt ${attempt}/${retries + 1} to ${url}`);

      const response = await fetch(url, enhancedOptions);
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      logWithTimestamp(`API call successful to ${url}`);
      return response;
    } catch (error: any) {
      logError(`API call attempt ${attempt} failed`, error);

      if (attempt === retries + 1 || error.name === "AbortError") {
        clearTimeout(timeoutId);
        throw error;
      }

      // Wait before retry (exponential backoff)
      const waitTime = Math.pow(2, attempt - 1) * 1000;
      logWithTimestamp(`Retrying in ${waitTime}ms...`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }

  clearTimeout(timeoutId);
  throw new Error("All retry attempts failed");
};

const getWhatsAppDetails = async (wa_id: any) => {
  try {
    logWithTimestamp(`Getting WhatsApp details for wa_id: ${wa_id}`);
    const db = (await clientPromise!).db();
    const collection = db.collection("whatsappbot_details");
    const result = await collection.findOne({
      phoneNumberID: wa_id,
      isEnabled: true,
    });

    if (result?.chatbotId) {
      logWithTimestamp(
        `WhatsApp details found for chatbotId: ${result.chatbotId}`
      );
      return result;
    }

    logWithTimestamp(`No WhatsApp details found for wa_id: ${wa_id}`);
    return null;
  } catch (error) {
    logError("Error getting chatbotID", error);
    return "error";
  }
};

const getResponseNumber = (res: any) => {
  const waId = res?.entry?.[0]?.changes?.[0]?.value?.contacts[0]?.wa_id;
  logWithTimestamp(`Extracted response number: ${waId}`);
  return waId;
};

//-----------------------------------------------------------This function will send message to whatsapp
async function sendMessageToWhatsapp(
  phoneNumberId: any,
  recipientPhoneNumber: any,
  accessToken: any,
  message: any
) {
  const version = "v18.0";
  const url = `https://graph.facebook.com/${version}/${phoneNumberId}/messages`;

  logWithTimestamp(`Sending WhatsApp message to ${recipientPhoneNumber}`, {
    phoneNumberId,
    messageLength: message?.length || 0,
  });

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

  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(data),
  };

  try {
    const response = await makeAPICallWithTimeout(url, options, 15000);
    logWithTimestamp(
      `WhatsApp message sent successfully to ${recipientPhoneNumber}`
    );
  } catch (error) {
    logError(
      `Failed to send WhatsApp message to ${recipientPhoneNumber}`,
      error
    );
    throw error; // Re-throw to handle upstream
  }
}

// Updated Assistant API helper functions using OpenAI library
async function createThread() {
  logWithTimestamp("Creating new OpenAI thread");

  try {
    const thread = await openai.beta.threads.create();
    logWithTimestamp(`Thread created successfully: ${thread.id}`);
    return thread;
  } catch (error) {
    logError("Failed to create thread", error);
    throw error;
  }
}

async function addMessageToThread(threadId: string, message: string) {
  logWithTimestamp(`Adding message to thread: ${threadId}`, {
    messageLength: message.length,
  });

  try {
    const threadMessage = await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: message,
    });
    logWithTimestamp(`Message added to thread successfully`);
    return threadMessage;
  } catch (error) {
    logError(`Failed to add message to thread ${threadId}`, error);
    throw error;
  }
}

async function runAssistant(
  threadId: string,
  assistantId: string,
  instructions?: string
) {
  logWithTimestamp(`Running assistant ${assistantId} on thread ${threadId}`);

  try {
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: assistantId,
      // ...(instructions && { instructions }),
    });
    logWithTimestamp(`Assistant run started: ${run.id}`);
    return run;
  } catch (error) {
    logError(`Failed to run assistant ${assistantId}`, error);
    throw error;
  }
}

async function checkRunStatus(threadId: string, runId: string) {
  try {
    const run = await openai.beta.threads.runs.retrieve(threadId, runId);
    logWithTimestamp(`Run status check: ${run.status}`, {
      runId,
      threadId,
      status: run.status,
    });
    return run;
  } catch (error) {
    logError(`Failed to check run status ${runId}`, error);
    throw error;
  }
}

async function getThreadMessages(threadId: string) {
  logWithTimestamp(`Getting messages from thread: ${threadId}`);

  try {
    const messages = await openai.beta.threads.messages.list(threadId);
    logWithTimestamp(
      `Retrieved ${messages.data?.length || 0} messages from thread`
    );
    return messages;
  } catch (error) {
    logError(`Failed to get messages from thread ${threadId}`, error);
    throw error;
  }
}

async function waitForRunCompletion(
  threadId: string,
  runId: string,
  maxWaitTime = 60000
) {
  const startTime = Date.now();
  let checkCount = 0;
  const maxChecks = Math.floor(maxWaitTime / 2000); // Check every 2 seconds

  logWithTimestamp(`Waiting for run completion: ${runId}`, {
    maxWaitTime,
    maxChecks,
  });

  while (Date.now() - startTime < maxWaitTime && checkCount < maxChecks) {
    checkCount++;

    try {
      const runStatus = await checkRunStatus(threadId, runId);

      logWithTimestamp(`Run status check ${checkCount}/${maxChecks}`, {
        status: runStatus.status,
        elapsed: Date.now() - startTime,
      });

      if (runStatus.status === "completed") {
        logWithTimestamp(
          `Run completed successfully after ${Date.now() - startTime}ms`
        );
        return runStatus;
      } else if (
        runStatus.status === "failed" ||
        runStatus.status === "cancelled" ||
        runStatus.status === "expired"
      ) {
        const errorMessage = `Assistant run ${runStatus.status}: ${
          runStatus.last_error?.message || "Unknown error"
        }`;
        logError(errorMessage, runStatus.last_error || {});
        throw new Error(errorMessage);
      }

      // Progressive wait time (start with 2s, increase to 5s for longer runs)
      const waitTime = checkCount < 5 ? 2000 : 5000;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    } catch (error: any) {
      if (error.message.includes("Assistant run")) {
        throw error; // Re-throw assistant-specific errors
      }

      logError(`Error checking run status (attempt ${checkCount})`, error);

      // If we're near the end, throw the error
      if (checkCount >= maxChecks - 2) {
        throw error;
      }

      // Otherwise, wait and continue
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }

  const errorMessage = `Assistant run timed out after ${
    Date.now() - startTime
  }ms (${checkCount} checks)`;
  logError(errorMessage, {});
  throw new Error(errorMessage);
}

// Function to handle requires_action status for Assistant API
async function handleRequiredAction(
  threadId: string,
  runId: string,
  chatbotId: string,
  userID: string,
  messages: any[] = []
) {
  logWithTimestamp(`Handling required action for run: ${runId}`);

  try {
    const run = await openai.beta.threads.runs.retrieve(threadId, runId);

    if (run.status !== "requires_action") {
      logWithTimestamp(`Run status is ${run.status}, no action required`);
      return run;
    }

    const requiredAction = run.required_action;
    if (!requiredAction || requiredAction.type !== "submit_tool_outputs") {
      logError("Unexpected required action type", { requiredAction });
      throw new Error("Unexpected required action type");
    }

    logWithTimestamp(
      `Processing ${requiredAction.submit_tool_outputs.tool_calls.length} tool calls`
    );

    // Process each tool call using your existing handler
    const toolOutputs = await Promise.all(
      requiredAction.submit_tool_outputs.tool_calls.map(async (toolCall) => {
        logWithTimestamp(`Processing tool call: ${toolCall.function.name}`, {
          toolCallId: toolCall.id,
          functionName: toolCall.function.name,
          arguments: toolCall.function.arguments,
        });

        try {
          // Use your existing functionCallHandler
          const functionOutput = await functionCallHandler(
            toolCall,
            chatbotId,
            userID,
            messages,
            false // WEB_SEARCH parameter
          );

          return {
            tool_call_id: toolCall.id,
            output: functionOutput, // Your handler already returns JSON string
          };
        } catch (error: any) {
          logError(`Error executing function ${toolCall.function.name}`, error);
          return {
            tool_call_id: toolCall.id,
            output: JSON.stringify({
              success: false,
              message: `Function execution failed: ${error?.message}`,
            }),
          };
        }
      })
    );

    // Submit tool outputs
    logWithTimestamp(`Submitting ${toolOutputs.length} tool outputs`);
    const updatedRun = await openai.beta.threads.runs.submitToolOutputs(
      threadId,
      runId,
      {
        tool_outputs: toolOutputs,
      }
    );

    logWithTimestamp(`Tool outputs submitted successfully`);
    return updatedRun;
  } catch (error) {
    logError(`Failed to handle required action for run ${runId}`, error);
    throw error;
  }
}

async function waitForRunCompletionWithActions(
  threadId: string,
  runId: string,
  chatbotId: string,
  userID: string,
  messages: any[] = [],
  maxWaitTime = 60000
) {
  const startTime = Date.now();
  let checkCount = 0;
  const maxChecks = Math.floor(maxWaitTime / 2000);

  logWithTimestamp(
    `Waiting for run completion with action handling: ${runId}`,
    {
      maxWaitTime,
      maxChecks,
    }
  );

  while (Date.now() - startTime < maxWaitTime && checkCount < maxChecks) {
    checkCount++;

    try {
      const runStatus = await checkRunStatus(threadId, runId);

      logWithTimestamp(`Run status check ${checkCount}/${maxChecks}`, {
        status: runStatus.status,
        elapsed: Date.now() - startTime,
      });

      if (runStatus.status === "completed") {
        logWithTimestamp(
          `Run completed successfully after ${Date.now() - startTime}ms`
        );
        return runStatus;
      } else if (runStatus.status === "requires_action") {
        logWithTimestamp("Run requires action, handling...");

        // Handle the required action using your existing handler
        const updatedRun = await handleRequiredAction(
          threadId,
          runId,
          chatbotId,
          userID,
          messages
        );

        // Continue waiting for completion
        const waitTime = 2000;
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        continue;
      } else if (
        runStatus.status === "failed" ||
        runStatus.status === "cancelled" ||
        runStatus.status === "expired"
      ) {
        const errorMessage = `Assistant run ${runStatus.status}: ${
          runStatus.last_error?.message || "Unknown error"
        }`;
        logError(errorMessage, runStatus.last_error || {});
        throw new Error(errorMessage);
      }

      // Progressive wait time
      const waitTime = checkCount < 5 ? 2000 : 5000;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    } catch (error: any) {
      if (error.message.includes("Assistant run")) {
        throw error;
      }

      logError(`Error checking run status (attempt ${checkCount})`, error);

      if (checkCount >= maxChecks - 2) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }

  const errorMessage = `Assistant run timed out after ${
    Date.now() - startTime
  }ms (${checkCount} checks)`;
  logError(errorMessage, {});
  throw new Error(errorMessage);
}

export async function GET(req: NextRequest) {
  let hubMode = req.nextUrl.searchParams.get("hub.mode");
  let hubChallenge = req.nextUrl.searchParams.get("hub.challenge");
  let hubToken = req.nextUrl.searchParams.get("hub.verify_token");

  logWithTimestamp("Webhook verification request", { hubMode, hubToken });

  try {
    const db = (await clientPromise!).db();
    const collection = db?.collection("whatsappbot_details");

    const tokenDetails = await collection?.findOne({
      webhook_verification_token: hubToken,
    });

    if (
      hubMode === "subscribe" &&
      hubToken === tokenDetails?.webhook_verification_token
    ) {
      if (tokenDetails) {
        await collection?.updateOne(
          { webhook_verification_token: hubToken },
          { $set: { isTokenVerified: true } }
        );
        logWithTimestamp("Token verified and updated in database");
      }

      logWithTimestamp("Webhook verified successfully");
      return new Response(hubChallenge);
    }

    logWithTimestamp("Invalid webhook credentials");
    return new Response("Invalid Credentials", { status: 400 });
  } catch (error) {
    logError("Error in webhook verification", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  let step = 0;

  try {
    step = 1;
    let res: any = await req.json();
    logWithTimestamp("Received WhatsApp webhook", {
      hasEntry: !!res?.entry,
      entryLength: res?.entry?.length || 0,
    });

    step = 2;
    let questionFromWhatsapp =
      res?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.text?.body;

    logWithTimestamp(`Extracted question from WhatsApp`, {
      hasQuestion: !!questionFromWhatsapp,
      questionLength: questionFromWhatsapp?.length || 0,
      question: questionFromWhatsapp?.substring(0, 100), // Log first 100 chars for debugging
    });

    if (questionFromWhatsapp === "this is a text message") {
      logWithTimestamp("Received test message, ignoring");
      return new Response("received", { status: 200 });
    }

    if (
      questionFromWhatsapp == undefined ||
      questionFromWhatsapp.trim().length <= 0
    ) {
      logWithTimestamp("No valid question received, ignoring");
      return new Response("received", { status: 200 });
    }

    step = 3;
    logWithTimestamp("Starting WhatsApp operation");
    await whatsAppOperation(res);

    const totalTime = Date.now() - startTime;
    logWithTimestamp(
      `WhatsApp operation completed successfully in ${totalTime}ms`
    );
    return new Response("received", { status: 200 });
  } catch (error: any) {
    const totalTime = Date.now() - startTime;
    logError(`WhatsApp POST handler failed after ${totalTime}ms`, error, step);

    // Still return 200 to WhatsApp to avoid retries
    return new Response("received", { status: 200 });
  }
}

async function whatsAppOperation(res: any) {
  const operationStartTime = Date.now();
  let step = 0;
  let questionFromWhatsapp = "";
  let userPhoneNumber = "";
  let whatsAppDetailsResult: any = null;

  try {
    step = 1;
    questionFromWhatsapp =
      res?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.text?.body;
    const binessAccountNumber =
      res?.entry?.[0]?.changes?.[0]?.value?.metadata["phone_number_id"];

    logWithTimestamp(`Starting WhatsApp operation`, {
      businessAccountNumber: binessAccountNumber,
      questionLength: questionFromWhatsapp?.length || 0,
    });

    step = 2;
    whatsAppDetailsResult = await getWhatsAppDetails(binessAccountNumber);
    userPhoneNumber = getResponseNumber(res);

    if (!whatsAppDetailsResult || whatsAppDetailsResult === "error") {
      logWithTimestamp("No valid WhatsApp details found, exiting");
      return;
    }

    logWithTimestamp(`WhatsApp details retrieved`, {
      chatbotId: whatsAppDetailsResult.chatbotId,
      userPhoneNumber,
      isEnabled: whatsAppDetailsResult.isEnabled,
    });

    step = 3;
    const db = (await clientPromise!).db();
    const userChatBotcollections = db.collection("user-chatbots");
    const userChatBotResult = await userChatBotcollections.findOne({
      chatbotId: whatsAppDetailsResult.chatbotId,
    });

    if (!userChatBotResult) {
      logWithTimestamp("No chatbot configuration found");
      return;
    }

    step = 4;
    const userCollection = db?.collection("users");
    const userData = await userCollection.findOne({
      _id: new ObjectId(userChatBotResult.userId),
    });

    const endDate = userData?.endDate;
    const currentDate = new Date();

    logWithTimestamp(`User subscription check`, {
      userId: userChatBotResult.userId,
      endDate: endDate?.toISOString(),
      currentDate: currentDate.toISOString(),
      isExpired: currentDate > endDate,
    });

    if (currentDate > endDate) {
      logWithTimestamp("Subscription expired, sending notification");
      await sendMessageToWhatsapp(
        whatsAppDetailsResult.phoneNumberID,
        "+" + userPhoneNumber,
        whatsAppDetailsResult.whatsAppAccessToken,
        "Your subscription has ended"
      );
      return;
    }

    step = 5;
    if (whatsAppDetailsResult.isEnabled === false) {
      logWithTimestamp("Chatbot disabled, exiting");
      return;
    }

    const userID = userChatBotResult.userId;

    step = 6;
    const userDetailsCollection = db?.collection("user-details");
    const userDetailsResult = await userDetailsCollection.findOne({
      userId: userID,
    });

    logWithTimestamp(`User limits check`, {
      totalMessageCount: userDetailsResult?.totalMessageCount || 0,
      messageLimit: userDetailsResult?.messageLimit || 0,
      limitReached:
        (userDetailsResult?.totalMessageCount || 0) >=
        (userDetailsResult?.messageLimit || 0),
    });

    if (
      (userDetailsResult?.totalMessageCount || 0) >=
      (userDetailsResult?.messageLimit || 0)
    ) {
      logWithTimestamp("Message limit reached, sending notification");
      await sendMessageToWhatsapp(
        whatsAppDetailsResult.phoneNumberID,
        "+" + userPhoneNumber,
        whatsAppDetailsResult.whatsAppAccessToken,
        "Your limit reached please upgrade your plan"
      );
      return;
    }

    step = 7;
    // Get chatbot settings to determine which API to use
    let userChatBotSetting = db.collection("chatbot-settings");
    let userChatBotModel = await userChatBotSetting.findOne({
      userId: userID,
      chatbotId: userChatBotResult.chatbotId,
    });

    logWithTimestamp(`Chatbot model configuration`, {
      userId: userID,
      chatbotId: userChatBotResult.chatbotId,
      hasModel: !!userChatBotModel,
    });

    if (!userChatBotModel) {
      logWithTimestamp("No chatbot model configuration found");
      return;
    }

    logWithTimestamp(`Chatbot configuration`, {
      model: userChatBotModel?.model,
      botType: userChatBotResult?.botType,
      hasAssistantId: !!userChatBotModel?.chatbotId,
      temperature: userChatBotModel?.temperature,
    });

    const useAssistantAPI = userChatBotResult?.botType === "bot-v2";

    step = 8;
    let similaritySearchResults = "";

    // Only call Pinecone for Chat Completion API (bot-v1)
    // Assistant API (bot-v2) will handle context through file uploads or instructions
    if (!useAssistantAPI) {
      logWithTimestamp("Calling Pinecone API for context", {
        chatbotId: whatsAppDetailsResult.chatbotId,
        userId: userID,
        questionLength: questionFromWhatsapp.length,
      });

      const pineconeStartTime = Date.now();
      const response: any = await makeAPICallWithTimeout(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}api/pinecone`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userQuery: questionFromWhatsapp,
            chatbotId: whatsAppDetailsResult.chatbotId,
            userId: userID,
          }),
        },
        45000, // 45 second timeout for Pinecone
        1 // Only 1 retry for Pinecone to avoid loops
      );

      const pineconeTime = Date.now() - pineconeStartTime;
      const respText = await response.text();
      similaritySearchResults = respText;

      logWithTimestamp(`Pinecone API completed in ${pineconeTime}ms`, {
        responseLength: similaritySearchResults?.length || 0,
        responsePreview: similaritySearchResults?.substring(0, 200),
      });
    }

    step = 9;
    // Get chat history
    let userChatHistoryCollection = db.collection("whatsapp-chat-history");
    let userChatHistory: WhatsAppChatHistoryType =
      await userChatHistoryCollection.findOne({
        userId: userID,
        date: moment().utc().format("YYYY-MM-DD"),
      });

    step = 10;
    let aiResponse: string = "";
    let usage: any = {
      completion_tokens: 0,
      prompt_tokens: 0,
      total_tokens: 0,
    };

    if (useAssistantAPI) {
      // Use Assistant API
      logWithTimestamp("Using Assistant API for response generation");

      let threadId: any;

      // Check if we have existing chat history with threadId
      if (userChatHistory?.chats?.[`${userPhoneNumber}`]?.threadId) {
        threadId = userChatHistory.chats[`${userPhoneNumber}`].threadId;
        logWithTimestamp(`Using existing thread: ${threadId}`);
      } else {
        // Create new thread
        const thread = await createThread();
        threadId = thread.id;
        logWithTimestamp(`Created new thread: ${threadId}`);
      }

      // Add user message to thread
      await addMessageToThread(threadId, questionFromWhatsapp);

      // Run the assistant
      const run = await runAssistant(
        threadId,
        userChatBotModel.chatbotId,
        userChatBotModel?.instruction
      );

      // Wait for completion
      await waitForRunCompletionWithActions(
        threadId,
        run.id,
        whatsAppDetailsResult.chatbotId,
        userID,
        userChatHistory?.chats?.[`${userPhoneNumber}`]?.messages || []
      );

      // Get the assistant's response
      const messages: any = await getThreadMessages(threadId);
      aiResponse = messages.data[0].content[0].text.value;

      // Estimate usage for Assistant API
      usage = {
        completion_tokens: encode(aiResponse).length,
        prompt_tokens: encode(questionFromWhatsapp).length,
        total_tokens:
          encode(aiResponse).length + encode(questionFromWhatsapp).length,
      };

      // Update or create chat history
      if (!userChatHistory) {
        await userChatHistoryCollection.insertOne({
          userId: userID,
          chatbotId: whatsAppDetailsResult.chatbotId,
          chats: {
            [`${userPhoneNumber}`]: {
              messages: [
                {
                  role: "user",
                  content: questionFromWhatsapp,
                },
                {
                  role: "assistant",
                  content: aiResponse,
                },
              ],
              usage: usage,
              threadId: threadId,
              assistantId: userChatBotModel.chatbotId,
            },
          },
          date: moment().utc().format("YYYY-MM-DD"),
        });
      } else {
        // Update existing chat history
        if (!userChatHistory.chats[`${userPhoneNumber}`]) {
          userChatHistory.chats[`${userPhoneNumber}`] = {
            messages: [],
            usage: { completion_tokens: 0, prompt_tokens: 0, total_tokens: 0 },
            threadId: threadId,
            assistantId: userChatBotModel.chatbotId,
          };
        }

        userChatHistory.chats[`${userPhoneNumber}`].messages.push(
          {
            role: "user",
            content: questionFromWhatsapp,
          },
          {
            role: "assistant",
            content: aiResponse,
          }
        );

        // Update usage
        userChatHistory.chats[`${userPhoneNumber}`].usage.completion_tokens +=
          usage.completion_tokens;
        userChatHistory.chats[`${userPhoneNumber}`].usage.prompt_tokens +=
          usage.prompt_tokens;
        userChatHistory.chats[`${userPhoneNumber}`].usage.total_tokens +=
          usage.total_tokens;
        userChatHistory.chats[`${userPhoneNumber}`].threadId = threadId;

        // Update in database
        await userChatHistoryCollection.updateOne(
          { userId: userID, date: moment().utc().format("YYYY-MM-DD") },
          {
            $set: {
              chats: userChatHistory.chats,
            },
          }
        );
      }
    } else {
      // Use Chat Completion API (existing logic)
      logWithTimestamp("Using Chat Completion API for response generation");

      let conversationMessages: any = [];
      let similarSearchToken = encode(similaritySearchResults).length;
      let instructionTokenLength = encode(userChatBotModel?.instruction).length;
      let currentQuestionsTotalTokens = encode(questionFromWhatsapp).length;

      // Handle existing chat history for Chat Completion API
      if (userChatHistory?.chats?.[`${userPhoneNumber}`]) {
        let previousTotalTokens = userChatHistory.chats[`${userPhoneNumber}`]
          .usage.total_tokens as number;
        let totalCountedToken =
          previousTotalTokens +
          currentQuestionsTotalTokens +
          similarSearchToken;
        conversationMessages =
          userChatHistory.chats[`${userPhoneNumber}`].messages;

        // Token limit management
        const tokenLimits = [
          { model: "gpt-3.5-turbo", tokens: 4000 },
          { model: "gpt-4", tokens: 8000 },
          { model: "gpt-4-turbo", tokens: 128000 },
        ];

        for (const limit of tokenLimits) {
          if (
            limit.model === userChatBotModel.model &&
            totalCountedToken >= limit.tokens
          ) {
            let tokensToRemove = totalCountedToken - limit.tokens;
            let index = 0;
            let tokens = 0;

            while (
              tokens < tokensToRemove &&
              index < conversationMessages.length
            ) {
              tokens += calculateTokens(conversationMessages[index]);
              index++;
            }

            conversationMessages.splice(0, index);
            break;
          }
        }
      }

      // Make OpenAI API call
      const responseOpenAI: any = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENAI_KEY}`,
          },
          body: JSON.stringify({
            model: userChatBotModel.model,
            temperature: userChatBotModel?.temperature ?? 0,
            top_p: 1,
            messages: [
              {
                role: "system",
                content: `${userChatBotModel?.instruction}

                context:
             ${similaritySearchResults}`,
              },
              ...conversationMessages,
              {
                role: "user",
                content: `query: ${questionFromWhatsapp}`,
              },
            ],
          }),
        }
      );

      const openaiBody = JSON.parse(await responseOpenAI.text());
      aiResponse = openaiBody.choices[0].message.content;
      usage = openaiBody.usage;

      // Update or create chat history for Chat Completion API
      if (!userChatHistory) {
        await userChatHistoryCollection.insertOne({
          userId: userID,
          chatbotId: whatsAppDetailsResult.chatbotId,
          chats: {
            [`${userPhoneNumber}`]: {
              messages: [
                {
                  role: "user",
                  content: questionFromWhatsapp,
                },
                {
                  role: "assistant",
                  content: aiResponse,
                },
              ],
              usage: {
                completion_tokens: usage.completion_tokens,
                prompt_tokens:
                  usage.prompt_tokens -
                  instructionTokenLength -
                  similarSearchToken,
                total_tokens:
                  usage.total_tokens -
                  instructionTokenLength -
                  similarSearchToken,
              },
            },
          },
          date: moment().utc().format("YYYY-MM-DD"),
        });
      } else {
        // Update existing chat history
        if (!userChatHistory.chats[`${userPhoneNumber}`]) {
          userChatHistory.chats[`${userPhoneNumber}`] = {
            messages: [
              {
                role: "user",
                content: questionFromWhatsapp,
              },
              {
                role: "assistant",
                content: aiResponse,
              },
            ],
            usage: {
              completion_tokens: usage.completion_tokens,
              prompt_tokens:
                usage.prompt_tokens -
                instructionTokenLength -
                similarSearchToken,
              total_tokens:
                usage.total_tokens -
                instructionTokenLength -
                similarSearchToken,
            },
          };
        } else {
          // Add new messages to existing conversation
          userChatHistory.chats[`${userPhoneNumber}`].messages.push(
            {
              role: "user",
              content: questionFromWhatsapp,
            },
            {
              role: "assistant",
              content: aiResponse,
            }
          );

          // Update usage tokens
          let oldTotalTokens =
            userChatHistory.chats[`${userPhoneNumber}`].usage.total_tokens;
          let userEnterToken = currentQuestionsTotalTokens;
          let openAICompletionToken = usage.completion_tokens;
          oldTotalTokens += userEnterToken + openAICompletionToken;

          let oldPromptTokens =
            userChatHistory.chats[`${userPhoneNumber}`].usage.prompt_tokens;
          oldPromptTokens += currentQuestionsTotalTokens;

          userChatHistory.chats[`${userPhoneNumber}`].usage = {
            completion_tokens: usage.completion_tokens,
            prompt_tokens: oldPromptTokens,
            total_tokens: oldTotalTokens,
          };
        }

        // Update in database
        await userChatHistoryCollection.updateOne(
          { userId: userID, date: moment().utc().format("YYYY-MM-DD") },
          {
            $set: {
              chats: userChatHistory.chats,
            },
          }
        );
      }
    }

    step = 11;
    // Update message count
    const collections = db?.collection("user-details");
    const result = await collections.findOne({ userId: userID });
    if (result?.totalMessageCount !== undefined && aiResponse) {
      await collections.updateOne(
        { userId: userID },
        { $set: { totalMessageCount: result.totalMessageCount + 1 } }
      );
    }

    step = 12;
    // Send response to WhatsApp
    if (aiResponse) {
      await sendMessageToWhatsapp(
        whatsAppDetailsResult.phoneNumberID,
        "+" + userPhoneNumber,
        whatsAppDetailsResult.whatsAppAccessToken,
        aiResponse
      );
    }

    const operationTime = Date.now() - operationStartTime;
    logWithTimestamp(`WhatsApp operation completed in ${operationTime}ms`);
  } catch (error: any) {
    const operationTime = Date.now() - operationStartTime;
    logError(`WhatsApp operation failed after ${operationTime}ms`, error, step);

    // Send error notification to user if we have the details
    if (whatsAppDetailsResult && userPhoneNumber) {
      try {
        await sendMessageToWhatsapp(
          whatsAppDetailsResult.phoneNumberID,
          "+" + userPhoneNumber,
          whatsAppDetailsResult.whatsAppAccessToken,
          "I'm experiencing technical difficulties. Please try again in a moment."
        );
      } catch (notificationError) {
        logError("Failed to send error notification", notificationError);
      }
    }

    throw error; // Re-throw to be handled by caller
  }
}

// Token calculation helper (unchanged)
function calculateTokens(conversationMessages: {
  role: string;
  content: string;
}) {
  const token = encode(conversationMessages.content).length;
  return token;
}
