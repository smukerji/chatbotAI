import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
// import { NextApiResponse } from "next";
import clientPromise from "@/db";
import  {ObjectId}  from "mongodb";
import {encodeChat,
  encode,
  decode,
  isWithinTokenLimit,
} from 'gpt-tokenizer'

import moment from 'moment';

interface WhatsAppChatHistoryType {
  _id?: ObjectId;
  userId: string;
  chatbotId: string;
  chats: {
    [key:string]: {
      messages: {
        role: string;
        content: string;
      }[],
      usage:{
        completion_tokens: number;
        prompt_tokens:number;
        total_tokens:number;
      }
    }
  }
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
async function sendMessageToWhatsapp(phoneNumberId:any,recipientPhoneNumber:any,accessToken:any,message:any){
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
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    // Handle the data as needed
  } catch (error) {
    // Handle the error as needed
    console.log("whatsapp sending message error \n",error);
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

  return new Response("Invalid Credentials", { status: 400 });
}

// WhatsApp will triger this post request once user asked question to bot and also response to the user
export async function POST(req: NextRequest) {

  let res: any = await req.json();

  setImmediate(async () => {
    await whatsAppOperation(res);
  });

  // return NextResponse.json({ message: "received" });
  return new Response("received", { status: 200 });
}

async function whatsAppOperation(res: any) {

  const tokenLimit = [
    {
      model: "gpt-3.5-turbo",
      tokens: 15385,
    },
    {
      model: "gpt-4",
      tokens: 8000
    }
  ]

  let step = 1;


  try {


    let questionFromWhatsapp =
      res?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.text?.body;// question received from whatsapp
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
    //get the phone number id from the response
    const binessAccountNumber = res?.entry?.[0]?.changes?.[0]?.value?.metadata["phone_number_id"];

    // -----------------------------------------------------This function will if the subscription is active or not of user

    step = 2;
    let whatsAppDetailsResult: any = await getWhatsAppDetails(binessAccountNumber); //here you will recieved the chatbot unique id, based on this you would identify knowledge base
    const userPhoneNumber = getResponseNumber(res);//user phone number
    const db = (await clientPromise!).db();
    const userChatBotcollections = db.collection("user-chatbots");
    const userChatBotResult = await userChatBotcollections.findOne({
      chatbotId: whatsAppDetailsResult.chatbotId,
    });

    step = 3;
    const userCollection = db?.collection("users");
    const data = await userCollection.findOne({ _id: new ObjectId(userChatBotResult.userId) });
    const endDate = data?.endDate;
    // const isTelegram = data?.isWhatsapp;

    const currentDate = new Date();
    if (currentDate > endDate) {
      step = 4;
      await sendMessageToWhatsapp(whatsAppDetailsResult.phoneNumberID, "+" + userPhoneNumber, whatsAppDetailsResult.whatsAppAccessToken, 'Your subscription has ended')
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
      return new Response("received", { status: 200 }); ``
    }

    const userID = userChatBotResult.userId;

    //check whether limit is reached or not
    const version = "v18.0"; // Replace with your desired version
    // const phoneNumberId = process.env.WHATSAPPPHONENUMBERID; // Replace with your phone number ID
    const phoneNumberId = whatsAppDetailsResult.phoneNumberID;
    const recipientPhoneNumber = "+" + userPhoneNumber;
    // const accessToken = process.env.WHATSAPPTOKEN
    const accessToken = whatsAppDetailsResult.whatsAppAccessToken;

    step = 6;
    const userDetailsCollection = db?.collection("user-details");
    const userDetailsResult = await userDetailsCollection.findOne({ userId: userID });
    if (userDetailsResult.totalMessageCount >= userDetailsResult.messageLimit) {
      await sendMessageToWhatsapp(whatsAppDetailsResult.phoneNumberID, "+" + userPhoneNumber, whatsAppDetailsResult.whatsAppAccessToken, 'Your limit reached please upgrade your plan')
      return new Response("received", { status: 200 });
    }

    step = 7;
    // if we have user id
    const response: any = await fetch(
      `${process.env.NEXT_PUBLIC_WEBSITE_URL}api/pinecone`,
      {
        method: "POST",
        body: JSON.stringify({
          userQuery: questionFromWhatsapp,
          chatbotId: whatsAppDetailsResult.chatbotId,
          userId: userID,
        }),
      }
    );

    /// parse the response and extract the similarity results
    const respText = await response.text();
    let similaritySearchResults = JSON.parse(respText).join("\n");
 

    step = 8;
    //get the user's chatbot history
    let userChatHistoryCollection = db.collection("whatsapp-chat-history");
    let userChatHistory: WhatsAppChatHistoryType = await userChatHistoryCollection.findOne({
      userId: userID,
      date: moment().utc().format('YYYY-MM-DD')
    });

    //get the user's chatbot setting
    let userChatBotSetting = db.collection("chatbot-settings");

    //find the user's chatbot model
    let userChatBotModel = await userChatBotSetting.findOne({
      userId: userID,
    });

    step = 9;
    //if user chat history is not available, create a new chat history
    if (!userChatHistory) {
      // Fetch the response from the OpenAI API
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
            temperature: 0.5,
            top_p: 1,
            messages: [
              {
                role: "system",
                content: `Use the following pieces of context to answer the users question.
                  If you don't know the answer, just say that you don't know, don't try to make up an answer.
                  ----------------
                  context:
                  ${similaritySearchResults}
                  
                  Answer user query and include images write respect to each line if available`,
              },
              // ...conversationMessages,
              {
                role: "user",
                content: `Answer user query and include images in response if available in the given context 
                
                  query: ${questionFromWhatsapp} `,
              },
            ],
          }),
        }
      );

      const openaiBody = JSON.parse(await responseOpenAI.text());



      //--------update message count if we have response from openai
      //update message count and check message limit

      const collections = db?.collection("user-details");
      const result = await collections.findOne({ userId: userID });
      if (result?.totalMessageCount !== undefined && openaiBody.choices[0].message.content) {
        // If totalMessageCount exists, update it by adding 1
        await collections.updateOne(
          { userId: userID },
          { $set: { totalMessageCount: result.totalMessageCount + 1 } }
        );
      }

      // after getting response from open ai
      if (openaiBody.choices[0].message.content) {
        await sendMessageToWhatsapp(whatsAppDetailsResult.phoneNumberID, "+" + userPhoneNumber, whatsAppDetailsResult.whatsAppAccessToken, openaiBody.choices[0].message.content);

        let similarSearchToken = encode(similaritySearchResults).length;
        step = 10;
        //stores chat history
        await userChatHistoryCollection.insertOne({
          userId: userID,
          chatbotId: whatsAppDetailsResult.chatbotId,
          chats: {
            [`${userPhoneNumber}`]: {
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
                prompt_tokens: openaiBody.usage.prompt_tokens - similarSearchToken,
                total_tokens: openaiBody.usage.total_tokens - similarSearchToken
              }
            }
          },
          date: moment().utc().format('YYYY-MM-DD')
        });

        //return response 
        // return new Response("received", { status: 200 });
      }
    }
    //when user chat history is available
    else {

      step = 11;
      //calculate the total tokens based on user message
      let previousTotalTokens = 0;
      let similarSearchToken = encode(similaritySearchResults).length;
      let conversationMessages: any = [];
      let currentQuestionsTotalTokens: any = encode(questionFromWhatsapp).length;
      // let totalTokens = previousTotalTokens + currentQuestionsTotalTokens[1];

      //if xyz user's based on number, chat history is available
      if (userChatHistory.chats[`${userPhoneNumber}`]) {
        previousTotalTokens = userChatHistory.chats[`${userPhoneNumber}`].usage.total_tokens as number;
        let totalCountedToken = previousTotalTokens + currentQuestionsTotalTokens + similarSearchToken;
        conversationMessages = userChatHistory.chats[`${userPhoneNumber}`].messages;
        
        if (tokenLimit[0]["model"] == userChatBotModel.model && totalCountedToken >= tokenLimit[0].tokens) {
          // const removeCount = Math.floor(conversationMessages.length / 3); // Calculate one-third of the array length
          // conversationMessages.splice(0, removeCount); // Remove one-third of the messages from the start of the array

          //approach 1
          // while (totalCountedToken >= tokenLimit[0].tokens) {
          //   // Assume calculateTokens is a function that calculates the tokens for a message
          //   totalCountedToken -= calculateTokens(conversationMessages[0]);
          //   conversationMessages.shift();
          // }

          //approach 2
          let tokensToRemove = totalCountedToken - tokenLimit[0].tokens;
          let index = 0;
          let tokens = 0;

          // Find the index where the sum of tokens reaches the limit
          while (tokens < tokensToRemove && index < conversationMessages.length) {
            tokens += calculateTokens(conversationMessages[index]);
            index++;
          }

          // Remove the messages from the start of the array up to the found index
          conversationMessages.splice(0, index);
          // totalCountedToken -= tokens;

        }
        else if (tokenLimit[1]["model"] == userChatBotModel.model && totalCountedToken >= tokenLimit[1].tokens) {
          // const removeCount = Math.floor(conversationMessages.length / 3); // Calculate one-third of the array length
          // conversationMessages.splice(0, removeCount); // Remove one-third of the messages from the start of the array
          let tokensToRemove = totalCountedToken - tokenLimit[1].tokens;
          let index = 0;
          let tokens = 0;

          // Find the index where the sum of tokens reaches the limit
          while (tokens < tokensToRemove && index < conversationMessages.length) {
            tokens += calculateTokens(conversationMessages[index]);
            index++;
          }

          // Remove the messages from the start of the array up to the found index
          conversationMessages.splice(0, index);
          // totalCountedToken -= tokens;
        }
      }

      // similaritySearchResults = "My name is rudresh"


      step = 12;
      // Fetch the response from the OpenAI API
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
            // model:"gpt-4",
            temperature: 0.5,
            top_p: 1,
            messages: [
              {
                role: "system",
                content: `Use the following pieces of context to answer the users question.
                  If you don't know the answer, just say that you don't know, don't try to make up an answer.
                  ----------------
                  context:
                  ${similaritySearchResults}
                  
                  Answer user query and include images write respect to each line if available`,
              },
              ...conversationMessages,
              {
                role: "user",
                content: `Answer user query and include images in response if available in the given context 
                
                  query: ${questionFromWhatsapp} `,
              },
            ],
          }),
        }
      );

      //parse the response to json
      const openaiBody = JSON.parse(await responseOpenAI.text());

      //--------update message count if we have response from openai
      //update message count and check message limit
      const collections = db?.collection("user-details");
      const result = await collections.findOne({ userId: userID });
      if (result?.totalMessageCount !== undefined && openaiBody.choices[0].message.content) {
        // If totalMessageCount exists, update it by adding 1
        await collections.updateOne(
          { userId: userID },
          { $set: { totalMessageCount: result.totalMessageCount + 1 } }
        );
      }

      // after getting response from open ai
      if (openaiBody.choices[0].message.content) {
        await sendMessageToWhatsapp(whatsAppDetailsResult.phoneNumberID, "+" + userPhoneNumber, whatsAppDetailsResult.whatsAppAccessToken, openaiBody.choices[0].message.content)

        step = 13;
        //update the chat history
        //check if chat history has userPhoneNumber's chat history
        if (!userChatHistory.chats[`${userPhoneNumber}`]) { //if userPhoneNumber's chat history is not available, add that to the chat history
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
              prompt_tokens: openaiBody.usage.prompt_tokens  - similarSearchToken,
              total_tokens: openaiBody.usage.total_tokens - similarSearchToken
            }
          }

          //update the chat history
          await userChatHistoryCollection.updateOne(
            { userId: userID, date: moment().utc().format('YYYY-MM-DD') },
            {
              $set: {
                chats: userChatHistory.chats,
              },
            }
          );

          //return resonse
          // return new Response("received", { status: 200 });
        }
        else { //if chat history found, update the chat history

          step = 14;

          //update the chat history
          userChatHistory.chats[`${userPhoneNumber}`].messages.push({
            role: "user",
            content: `${questionFromWhatsapp}`,
          }, {
            role: "assistant",
            content: openaiBody.choices[0].message.content,
          });


          //total tokens addition
          let oldTotalTokens = userChatHistory.chats[`${userPhoneNumber}`].usage.total_tokens;
          let userEnterToken = currentQuestionsTotalTokens;
          let openAICompletionToken = openaiBody.usage.completion_tokens;
          oldTotalTokens += (userEnterToken + openAICompletionToken);

          //prompt tokens addition
          let oldPromptTokens = userChatHistory.chats[`${userPhoneNumber}`].usage.prompt_tokens;
          oldPromptTokens += currentQuestionsTotalTokens;


          //add the new to previoius tokens
          userChatHistory.chats[`${userPhoneNumber}`].usage = {
            completion_tokens: openaiBody.usage.completion_tokens,
            prompt_tokens: oldPromptTokens,
            total_tokens: oldTotalTokens
          }

          //update the chat history
          await userChatHistoryCollection.updateOne(
            { userId: userID, date: moment().utc().format('YYYY-MM-DD') },
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
  catch (error: any) {
    console.log("error at step", step);
    console.log("error", error);
  }

}


function calculateTokens(conversationMessages: { role: string, content: string }) {
  const token = encode(conversationMessages.content).length;
  return token;
}