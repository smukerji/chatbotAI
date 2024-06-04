import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "../../../../../../_helpers/server/api/api-handler";
import clientPromise from "../../../../../../../db";
import { ObjectId } from "mongodb";
import { encodeChat, encode, decode, isWithinTokenLimit } from "gpt-tokenizer";
import moment from "moment";
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

async function getChatbotId(telegramToken: any) {
  const db = (await clientPromise!).db();
  const collection = db?.collection("telegram-bot");
  const result = await collection?.findOne({
    telegramToken,
  });
  if (result) {
    const { chatbotId, userId, isEnabled } = result;
    return { chatbotId, userId, isEnabled };
  }
  return null;
}

//--------------- This code is for sending message to telegram
async function sendMessageToTelegram(
  telegramToken: any,
  chatId: any,
  text: string
) {
  //sending message to telegram
  const url = `https://api.telegram.org/bot${telegramToken}/sendMessage`;

  const body = {
    chat_id: chatId,
    text: text,
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const responseData = await response.json();
  } catch (error) {
    console.log("Error sending message to Telegram:", error);
  }
}

//post webhook
export async function POST(request: NextRequest) {
  const tokenLimit = [
    {
      model: "gpt-3.5-turbo",
      tokens: 15385,
    },
    {
      model: "gpt-4",
      tokens: 8000,
    },
  ];

  let step = 1;

  try {
    let req = await request.json();
    const chatId = req?.message?.chat?.id;
    const telegramToken = request?.nextUrl?.searchParams.get("token");
    let queryFromTelegramUser: string = req?.message?.text;

    // This code is for getting chatbotId from telegram token

    step = 2;
    const chatBotResult = await getChatbotId(telegramToken);

    //check if object is empty - if yes return
    // ---------------------------------------------------- If user might have deleted bot but still messaging
    if (!chatBotResult) {
      return new Response("received", { status: 200 });
    }

    const { chatbotId, userId, isEnabled } = chatBotResult;

    const db = (await clientPromise!).db();
    // -----------------------------------------------------This function will if the subscription is active or not of user

    const collection = db?.collection("users");
    const data = await collection.findOne({ _id: new ObjectId(userId) });
    const endDate = data?.endDate;
    // const isTelegram = data?.isWhatsapp;

    step = 3;
    const currentDate = new Date();
    if (currentDate > endDate) {
      await sendMessageToTelegram(
        telegramToken,
        chatId,
        "Your subscription has ended"
      );
      return new Response("received", { status: 200 });
    } else {
      console.log("continue..");
    }

    //get the user's chatbot setting
    let userChatBotSetting = db.collection("chatbot-settings");

    //find the user's chatbot model
    let userChatBotModel = await userChatBotSetting.findOne({
      userId: userId,
    });

    //----------------------------------------------------------- Now check whether chatbot is enabled or not

    step = 4;
    if (isEnabled === false) {
      // return { message: "Chatbot with WhatsApp is disabled" };
      console.log("Chatbot with Telegram is disabled ");
      // return NextResponse.json({ message: "received" });
      return new Response("received", { status: 200 });
    }

    step = 5;
    //---------------------------------------------------------- if user types /start
    if (req?.message?.text === "/start") {
      await sendMessageToTelegram(
        telegramToken,
        chatId,
        "Welcome how can we help you?"
      );
      return new Response("received", { status: 200 });
    }
    //----------------------------------------------------------- check whether message limit is reached or not

    step = 6;
    // const db = (await clientPromise!).db();
    const collections = db?.collection("user-details");
    const result = await collections.findOne({ userId });
    if (result.totalMessageCount >= result.messageLimit) {
      await sendMessageToTelegram(
        telegramToken,
        chatId,
        "Your limit reached please upgrade your plan"
      );
      return new Response("received", { status: 200 });
    }

    step = 7;
    if (userId) {
      // write pinecone and open ai code
      // if we have user id
      const response: any = await fetch(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}api/pinecone`,
        {
          method: "POST",
          body: JSON.stringify({
            userQuery: req?.message?.text,
            chatbotId: chatbotId,
            userId: userId,
          }),
        }
      );

      /// parse the response and extract the similarity results
      const respText = await response.text();
      const similaritySearchResults = JSON.parse(respText).join("\n");

      step = 8;
      //get the user's chatbot history
      let userChatHistoryCollection = db.collection("telegram-chat-history");
      let userChatHistory: WhatsAppChatHistoryType =
        await userChatHistoryCollection.findOne({
          userId: userId,
          date: moment().utc().format("YYYY-MM-DD"),
        });

      //find the user's chatbot model
      let userChatBotModel = await userChatBotSetting.findOne({
        userId: userId,
      });

      step = 9;
      //if user chat history is not available, create a new chat history
      if (!userChatHistory) {
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
              temperature: userChatBotModel.temperature,
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
                // ...messages,
                {
                  role: "user",
                  content: `Answer user query and include images in response if available in the given context 
                          
                                      query: ${req?.message?.text} `,
                },
              ],
            }),
          }
        );

        const openaiBody = JSON.parse(await responseOpenAI.text());

        const collections = db?.collection("user-details");

        step = 10;
        const result = await collections.findOne({ userId });
        if (
          result?.totalMessageCount !== undefined &&
          openaiBody.choices[0].message.content
        ) {
          // If totalMessageCount exists, update it by adding 1
          await collections.updateOne(
            { userId },
            { $set: { totalMessageCount: result.totalMessageCount + 1 } }
          );
        }

        step = 11;
        if (openaiBody.choices[0].message.content) {
          let similarSearchToken = encode(similaritySearchResults).length;
          step = 10;
          //stores chat history
          await userChatHistoryCollection.insertOne({
            userId: userId,
            chatbotId: chatbotId,
            chats: {
              [`${chatId}`]: {
                messages: [
                  {
                    role: "user",
                    content: `${queryFromTelegramUser}`,
                  },
                  {
                    role: "assistant",
                    content: openaiBody.choices[0].message.content,
                  },
                ],
                usage: {
                  completion_tokens: openaiBody.usage.completion_tokens,
                  prompt_tokens:
                    openaiBody.usage.prompt_tokens - similarSearchToken,
                  total_tokens:
                    openaiBody.usage.total_tokens - similarSearchToken,
                },
              },
            },
            date: moment().utc().format("YYYY-MM-DD"),
          });
        }

        step = 12;
        // after getting response from open ai
        if (openaiBody.choices[0].message.content) {
          await sendMessageToTelegram(
            telegramToken,
            chatId,
            openaiBody.choices[0].message.content
          );
          return new Response("received", { status: 200 });
        }
      } else {
        //when user chat history is available

        step = 13;
        //calculate the total tokens based on user message
        let previousTotalTokens = 0;
        let similarSearchToken = encode(similaritySearchResults).length;
        let conversationMessages: any = [];
        let currentQuestionsTotalTokens: any = encode(
          queryFromTelegramUser
        ).length;
        // let totalTokens = previousTotalTokens + currentQuestionsTotalTokens[1];

        if (userChatHistory.chats[`${chatId}`]) {
          previousTotalTokens = userChatHistory.chats[`${chatId}`].usage
            .total_tokens as number;
          let totalCountedToken =
            previousTotalTokens +
            currentQuestionsTotalTokens +
            similarSearchToken;
          conversationMessages = userChatHistory.chats[`${chatId}`].messages;

          step = 14;
          if (
            tokenLimit[0]["model"] == userChatBotModel.model &&
            totalCountedToken >= tokenLimit[0].tokens
          ) {
            let tokensToRemove = totalCountedToken - tokenLimit[0].tokens;
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

            conversationMessages.splice(0, index);
          } else if (
            tokenLimit[1]["model"] == userChatBotModel.model &&
            totalCountedToken >= tokenLimit[1].tokens
          ) {
            let tokensToRemove = totalCountedToken - tokenLimit[1].tokens;
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
        }
        step = 15;

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
              temperature: userChatBotModel.temperature,
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
                          
                query: ${queryFromTelegramUser} `,
                },
              ],
            }),
          }
        );

        const openaiBody = JSON.parse(await responseOpenAI.text());
        //--------update message count if we have response from openai
        //update message count and check message limit
        step = 16;
        const collections = db?.collection("user-details");
        const result = await collections.findOne({ userId: userId });
        if (
          result?.totalMessageCount !== undefined &&
          openaiBody.choices[0].message.content
        ) {
          // If totalMessageCount exists, update it by adding 1
          await collections.updateOne(
            { userId: userId },
            { $set: { totalMessageCount: result.totalMessageCount + 1 } }
          );
        }

        step = 17;
        // after getting response from open ai
        if (openaiBody.choices[0].message.content) {
          await sendMessageToTelegram(
            telegramToken,
            chatId,
            openaiBody.choices[0].message.content
          );

          step = 18;
          if (!userChatHistory.chats[`${chatId}`]) {
            //if userPhoneNumber's chat history is not available, add that to the chat history
            userChatHistory.chats[`${chatId}`] = {
              messages: [
                {
                  role: "user",
                  content: `${queryFromTelegramUser}`,
                },
                {
                  role: "assistant",
                  content: openaiBody.choices[0].message.content,
                },
              ],
              usage: {
                completion_tokens: openaiBody.usage.completion_tokens,
                prompt_tokens:
                  openaiBody.usage.prompt_tokens - similarSearchToken,
                total_tokens:
                  openaiBody.usage.total_tokens - similarSearchToken,
              },
            };
            //update the chat history
            await userChatHistoryCollection.updateOne(
              { userId: userId, date: moment().utc().format("YYYY-MM-DD") },
              {
                $set: {
                  chats: userChatHistory.chats,
                },
              }
            );
          } else {
            step = 19;
            //update the chat history
            userChatHistory.chats[`${chatId}`].messages.push(
              {
                role: "user",
                content: `${queryFromTelegramUser}`,
              },
              {
                role: "assistant",
                content: openaiBody.choices[0].message.content,
              }
            );

            //total tokens addition
            let oldTotalTokens =
              userChatHistory.chats[`${chatId}`].usage.total_tokens;
            let userEnterToken = currentQuestionsTotalTokens;
            let openAICompletionToken = openaiBody.usage.completion_tokens;
            oldTotalTokens += userEnterToken + openAICompletionToken;

            //prompt tokens addition
            let oldPromptTokens =
              userChatHistory.chats[`${chatId}`].usage.prompt_tokens;
            oldPromptTokens += currentQuestionsTotalTokens;

            //add the new to previoius tokens
            userChatHistory.chats[`${chatId}`].usage = {
              completion_tokens: openaiBody.usage.completion_tokens,
              prompt_tokens: oldPromptTokens,
              total_tokens: oldTotalTokens,
            };

            step = 20;
            //update the chat history
            await userChatHistoryCollection.updateOne(
              { userId: userId, date: moment().utc().format("YYYY-MM-DD") },
              {
                $set: {
                  chats: userChatHistory.chats,
                },
              }
            );
          }
          return new Response("received", { status: 200 });
        }
      }
    }

    return new Response("received", { status: 200 });
  } catch (error: any) {
    console.log("error at step", step);
    console.log("error", error);
  }
}

function calculateTokens(conversationMessages: {
  role: string;
  content: string;
}) {
  const token = encode(conversationMessages.content).length;
  return token;
}
