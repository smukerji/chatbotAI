import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
// import { NextApiResponse } from "next";
import clientPromise from "@/db";
import { ObjectId } from "mongodb";
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

  const tokenLimit = [
    {
      model: "gpt-3.5-turbo",
      tokens: 4096,
    },
    {
      model:"gpt-4",
      tokens: 8000
    }
  ]

  let step = 1;
  try {


    let res: any = await req.json();
    let questionFromWhatsapp =
      res?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.text?.body;// question received from whatsapp
    new Response("received", { status: 200 });

    if(questionFromWhatsapp === "this is a text message"){
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
      return new Response("received", { status: 200 });``
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
      date:moment().utc().format('YYYY-MM-DD')
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
              model: "gpt-3.5-turbo",
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
            { $set: { totalMessageCount: result.totalMessageCount + 1   } }
          );
        }

        // after getting response from open ai
        if (openaiBody.choices[0].message.content) {
          await sendMessageToWhatsapp(whatsAppDetailsResult.phoneNumberID, "+" + userPhoneNumber, whatsAppDetailsResult.whatsAppAccessToken, openaiBody.choices[0].message.content);

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
                usage:{
                  completion_tokens: openaiBody.usage.completion_tokens,
                  prompt_tokens: openaiBody.usage.prompt_tokens,
                  total_tokens: openaiBody.usage.total_tokens
                }
              }
            },
            date: moment().utc().format('YYYY-MM-DD')
          });

          //return response 
          return new Response("received", { status: 200 });
        }
    }
    else {
            
      step = 11;
      //calculate the total tokens based on user message
      let previousTotalTokens = 0;
      let conversationMessages:any = [] ;
      let currentQuestionsTotalTokens:any = encode(questionFromWhatsapp);
      let totalTokens = previousTotalTokens + currentQuestionsTotalTokens[1];
      
      if(userChatHistory.chats[`${userPhoneNumber}`]){
        previousTotalTokens = userChatHistory.chats[`${userPhoneNumber}`].usage.total_tokens as number;
        conversationMessages = userChatHistory.chats[`${userPhoneNumber}`].messages;
            
        if (tokenLimit[0].model === userChatBotModel.model && totalTokens >= tokenLimit[0].tokens) {
          const removeCount = Math.floor(conversationMessages.length / 3); // Calculate one-third of the array length
          conversationMessages.splice(0, removeCount); // Remove one-third of the messages from the start of the array
        }
        else if (tokenLimit[1].model === userChatBotModel.model && totalTokens >= tokenLimit[0].tokens) {
          const removeCount = Math.floor(conversationMessages.length / 3); // Calculate one-third of the array length
          conversationMessages.splice(0, removeCount); // Remove one-third of the messages from the start of the array
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
            model: "gpt-3.5-turbo",
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
              prompt_tokens: openaiBody.usage.prompt_tokens,
              total_tokens: openaiBody.usage.total_tokens
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
          return new Response("received", { status: 200 });
        }
        else {

          step = 14;
     
          //update the chat history
          userChatHistory.chats[`${userPhoneNumber}`].messages.push({
            role: "user",
            content: `${questionFromWhatsapp}`,
          }, {
            role: "assistant",
            content: openaiBody.choices[0].message.content,
          });

          //count the total tokens of train data
          // let conversationalMessageTokenencode(conversationMessages)
          let totalTokenEncoded = encode(similaritySearchResults);
          let totalPromptTokens = openaiBody.usage.prompt_tokens - totalTokenEncoded[1];
          let calculatedPromptToken = totalPromptTokens + userChatHistory.chats[`${userPhoneNumber}`].usage.prompt_tokens;
          let calculatedTotalToken = openaiBody.usage.completion_tokens + calculatedPromptToken;
          // if (totalTokens < 0) {
          //   openaiBody.usage.total_tokens += Math.abs(totalTokens);
          // }
          // else if(totalTokens > )

          //add the new to previoius tokens
          userChatHistory.chats[`${userPhoneNumber}`].usage = {
            completion_tokens: openaiBody.usage.completion_tokens,
            prompt_tokens: calculatedPromptToken,
            total_tokens: calculatedTotalToken
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
          return new Response("received", { status: 200 });

        }

      }

    }

  }
  catch (error: any) {
    console.log("error at step", step);
    console.log("error", error);
  }

  // return NextResponse.json({ message: "received" });
  return new Response("received", { status: 200 });
}
