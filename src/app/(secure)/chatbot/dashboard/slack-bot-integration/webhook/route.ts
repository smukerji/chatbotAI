import clientPromise from "@/db";
import { encode } from "gpt-tokenizer";
import moment from "moment";
import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";
const { WebClient, LogLevel } = require("@slack/web-api");

interface SlackAppData {
  appId: string;
  userId: string;
  authOToken: string;
  chatBotId: string;
}
interface SlackChatHistoryType {
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
  date: string;
}

export async function POST(req: NextRequest) {
  try {
    let retryNum = req.headers.get("X-Slack-Retry-Num");
    //if retryNum is available then return the response with status 200
    if (retryNum) {
      return new NextResponse("", { status: 200 });
    }
    //read the incomming parameter from webhook
    let resData: any = await req.json();
    // return the challenge on first time verification
    if (resData.challenge) {
      return new NextResponse(
        JSON.stringify({ challenge: resData.challenge }),
        { status: 200 }
      );
    } else {
      if (resData.event.type === "app_mention") {
        // setImmediate(async () => {
        await writeInDataBase(resData);
        // });

        return new NextResponse("", { status: 200 });
      } else {
        //handle else part here.
      }
    }
  } catch (error: any) {
    console.log("error", error);
  }
}

async function writeInDataBase(data: any) {
  let updatedMessageCount: {
    isUpdated: boolean;
    updatedResult: any;
    userInfo: any;
  } = {
    isUpdated: false,
    updatedResult: null,
    userInfo: null,
  };

  try {
    const appId = data.api_app_id;
    const channelId = data.event.channel;

    //find is AppId is available
    const db = (await clientPromise!)?.db();
    let slackCollection = db.collection("slack-app-details");

    let appDetails: SlackAppData = await slackCollection.findOne({
      appId: appId,
    });

    const tokenLimit = [
      {
        model: "gpt-3.5-turbo",
        tokens: 15385,
      },
      {
        model: "gpt-4",
        tokens: 8000,
      },
      {
        model: "gpt-4o",
        tokens: 16000,
      },
    ];

    if (appDetails) {
      const authOToken = appDetails.authOToken;
      const chatBotId = appDetails.chatBotId;
      const message = data.event.text.replace(/<@.*?>\s*\n?/, "");
      const userID = appDetails.userId;
      //get the user's chatbot setting
      let userChatBotSetting = db.collection("chatbot-settings");

      //find the user's chatbot model
      let userChatBotModel = await userChatBotSetting.findOne({
        userId: userID,
      });

      const client = new WebClient(authOToken, {
        // LogLevel can be imported and used to make debugging simpler
        logLevel: LogLevel.DEBUG,
      });

      //if message is empty then return the message
      if (message.length === 0) {
        await client.chat.postMessage({
          channel: channelId,
          text: "I guess you sent me an empty message.",
          threadId: data.event.ts,
        });

        return new NextResponse("", { status: 200 });
      } else {
        //check if user chat count has reached the limit if not then increment the count
        let userDetailsCollection: any = await db.collection("user-details");
        let cursor = await userDetailsCollection.aggregate([
          {
            $match: { userId: userID },
          },
          {
            $addFields: {
              limitCross: {
                $cond: [
                  {
                    $gte: ["$totalMessageCount", "$messageLimit"],
                  },
                  true,
                  false,
                ],
              },
            },
          },
        ]);

        let limitCrossResult = await cursor.toArray();

        await cursor.close();
        //if limitCross is false then increment the message count
        if (limitCrossResult[0].limitCross === false) {
          //increment the message count
          let updatedResult = await userDetailsCollection.updateOne(
            { userId: userID },
            { $inc: { totalMessageCount: 1 } }
          );
          if (updatedResult.modifiedCount > 0) {
            updatedMessageCount.isUpdated = true;
            updatedMessageCount.userInfo = userID;
          }
          // Fetch the response from the Pinecone API
          const response: any = await fetch(
            `${process.env.NEXT_PUBLIC_WEBSITE_URL}api/pinecone`,
            {
              method: "POST",
              body: JSON.stringify({
                userQuery: message,
                chatbotId: chatBotId,
                userId: userID,
              }),
            }
          );

          /// parse the response and extract the similarity results
          const respText = await response.text();
          const similaritySearchResults = JSON.parse(respText).join("\n");

          let userChatHistoryCollection = db.collection("slack-chat-history");

          let userChatHistory: SlackChatHistoryType =
            await userChatHistoryCollection.findOne({
              userId: userID,
              date: moment().utc().format("YYYY-MM-DD"),
            });

          if (userChatHistory) {
            // If chat history for today exists, update it
            if (!userChatHistory.chats[appId]) {
              userChatHistory.chats[appId] = {
                messages: [],
                usage: {
                  completion_tokens: 0,
                  prompt_tokens: 0,
                  total_tokens: 0,
                },
              };
              await userChatHistoryCollection.updateOne(
                { userId: userID, date: moment().utc().format("YYYY-MM-DD") },
                { $set: { chats: userChatHistory.chats } }
              );
            }
          } else {
            // If chat history for today does not exist, create it
            userChatHistory = {
              userId: userID,
              chatbotId: chatBotId,
              chats: {
                [appId]: {
                  messages: [],
                  usage: {
                    completion_tokens: 0,
                    prompt_tokens: 0,
                    total_tokens: 0,
                  },
                },
              },
              date: moment().utc().format("YYYY-MM-DD"),
            };

            await userChatHistoryCollection.insertOne(userChatHistory);
          }

          //calculate the total tokens based on user message
          let previousTotalTokens = 0;
          let similarSearchToken = encode(similaritySearchResults).length;
          let conversationMessages: any = [];
          let currentQuestionsTotalTokens: any = encode(message).length;

          previousTotalTokens = userChatHistory?.chats[`${appId}`]?.usage
            ?.total_tokens as number;
          let totalCountedToken =
            previousTotalTokens +
            currentQuestionsTotalTokens +
            similarSearchToken;
          conversationMessages = userChatHistory?.chats[`${appId}`]?.messages;

          console.log(
            "{{{{{{{{{{{{{{{{{{{[",
            tokenLimit[1]["model"],
            userChatBotModel.model,
            conversationMessages
          );

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

            console.log("goessss in else ifff model 444");

            // Find the index where the sum of tokens reaches the limit
            while (
              tokens < tokensToRemove &&
              index < conversationMessages.length
            ) {
              tokens += calculateTokens(conversationMessages[index]);
              console.log("tokeeeeennnnnnnnnssssssss", tokens, index);

              index++;
            }
            console.log("LLLLLLLLLLLLLLL", conversationMessages);

            // Remove the messages from the start of the array up to the found index
            conversationMessages.splice(0, index);
          } else if (
            tokenLimit[2]["model"] == userChatBotModel.model &&
            totalCountedToken >= tokenLimit[2].tokens
          ) {
            let tokensToRemove = totalCountedToken - tokenLimit[2].tokens;
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

          console.log(">>>>>>>>>>>>>>>", conversationMessages);

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
                temperature: userChatBotModel.temperature,
                top_p: 1,
                messages: [
                  {
                    role: "system",
                    content: `${userChatBotModel?.instruction}
                  ----------------
                  context:
                  ${similaritySearchResults}
                  
                  Answer user query and include images write respect to each line if available`,
                  },
                  // ...messages,
                  ...conversationMessages,
                  {
                    role: "user",
                    content: `Answer user query and include images in response if available in the given context 
                
                            query: ${message} `,
                  },
                ],
              }),
            }
          );

          const openaiBody = JSON.parse(await responseOpenAI.text());

          // after getting response from open ai send the response to slack
          if (openaiBody.choices[0].message.content) {
            const tokenUsage = openaiBody.usage;
            let similarSearchToken = encode(similaritySearchResults).length;
            await client.chat.postMessage({
              channel: channelId,
              text: openaiBody.choices[0].message.content,
              thread_ts: data.event.ts,
            });

            // after sending the message store history in database

            const newChatEntry = {
              role: "user",
              content: `${message}`,
            };

            const assistantResponse = {
              role: "assistant",
              content: openaiBody.choices[0].message.content,
            };

            const newChatData = {
              messages: [newChatEntry, assistantResponse],
              usage: {
                completion_tokens: tokenUsage.completion_tokens,
                prompt_tokens: tokenUsage.prompt_tokens - similarSearchToken,
                total_tokens: tokenUsage.total_tokens - similarSearchToken,
              },
            };

            //stores chat history
            if (userChatHistory) {
              userChatHistory.chats[appId].messages.push(
                newChatEntry,
                assistantResponse
              );

              userChatHistory.chats[appId].usage.completion_tokens +=
                openaiBody.usage.completion_tokens;
              userChatHistory.chats[appId].usage.prompt_tokens +=
                openaiBody.usage.prompt_tokens - similarSearchToken;
              userChatHistory.chats[appId].usage.total_tokens +=
                openaiBody.usage.total_tokens - similarSearchToken;

              await userChatHistoryCollection.updateOne(
                { userId: userID, date: moment().utc().format("YYYY-MM-DD") },
                { $set: { chats: userChatHistory.chats } }
              );
            } else {
              // If no chat history for today exists, create a new entry

              await userChatHistoryCollection.insertOne({
                userId: userID,
                chatbotId: chatBotId,
                chats: {
                  [`${appId}`]: newChatData,
                },
                date: moment().utc().format("YYYY-MM-DD"),
              });
            }

            return new NextResponse("", { status: 200 });
          } else {
            //if update result is true and open ai didn't respond then decrement the message count
            if (updatedMessageCount.isUpdated) {
              await userDetailsCollection.updateOne(
                { userId: userID },
                { $inc: { totalMessageCount: -1 } }
              );
            }

            //if open ai didn't respond then send the message to slack
            await client.chat.postMessage({
              channel: channelId,
              text: "Torri AI is not able to answer for your query. Please try again later.",
              thread_ts: data.event.ts,
            });

            return new NextResponse("", { status: 200 });
          }
        } else {
          await client.chat.postMessage({
            channel: channelId,
            text: "You have reached the limit of message count. Please try again later.",
            thread_ts: data.event.ts,
          });
          return new NextResponse("", { status: 200 });
        }
      }
    }
  } catch (error: any) {
    //in case if any error occurs with open ai or slack api then decrement the message count
    try {
      const db = (await clientPromise!)?.db();
      let userDetailsCollection: any = await db.collection("user-details");
      if (updatedMessageCount.isUpdated) {
        await userDetailsCollection.updateOne(
          { userId: updatedMessageCount.userInfo },
          { $inc: { totalMessageCount: -1 } }
        );
      }
    } catch (error: any) {
      console.log("error", error);
    }
  }
}

function calculateTokens(conversationMessages: {
  role: string;
  content: string;
}) {
  const token = encode(conversationMessages.content).length;
  return token;
}
