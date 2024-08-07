import clientPromise from "@/db";
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
}

export async function POST(req: NextRequest) {
  //read the incomming parameter from webhook
  let resData: any = await req.json();
  let data = resData.resData;

  let step = 1;
  // ________________________________________________________start

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

    step = 2;
    //find is AppId is available
    const db = (await clientPromise!)?.db();
    let slackCollection = db.collection("slack-app-details");

    let appDetails: SlackAppData = await slackCollection.findOne({
      appId: appId,
    });
    if (appDetails) {
      const authOToken = appDetails.authOToken;
      const chatBotId = appDetails.chatBotId;
      const message = data.event.text.replace(/<@.*?>\s*\n?/, "");
      const userID = appDetails.userId;
      console.log("insideee app detailsss");

      step = 3;
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
      } else {
        step = 4;
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

        step = 5;
        await cursor.close();

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

          step = 6;
          /// parse the response and extract the similarity results
          const respText = await response.text();
          const similaritySearchResults = JSON.parse(respText).join("\n");
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
                  // ...messages,
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

          step = 7;
          console.log("this is step 77777777");

          // after getting response from open ai send the response to slack
          if (openaiBody.choices[0].message.content) {
            await client.chat.postMessage({
              channel: channelId,
              text: openaiBody.choices[0].message.content,
              thread_ts: data.event.ts,
            });

            // after sending the message store history in database
            let userChatHistoryCollection = db.collection("slack-chat-history");

            let userChatHistory: SlackChatHistoryType =
              await userChatHistoryCollection.findOne({
                userId: userID,
                date: moment().utc().format("YYYY-MM-DD"),
              });

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
              // usage: {
              //   completion_tokens: openaiBody.usage.completion_tokens,
              //   prompt_tokens: openaiBody.usage.prompt_tokens - similaritySearchResults,
              //   total_tokens: openaiBody.usage.total_tokens - similaritySearchResults,
              // },
            };

            //find the user's chatbot model
            // let userChatBotModel = await userChatBotSetting.findOne({
            //   userId: userId,
            // });

            //stores chat history
            if (userChatHistory) {
              // If chat history for today exists, update it
              if (!userChatHistory.chats[appId]) {
                console.log("goes in iffffffffffffffff");

                userChatHistory.chats[appId] = {
                  messages: [],
                  usage: {
                    completion_tokens: 0,
                    prompt_tokens: 0,
                    total_tokens: 0,
                  },
                };
              }

              userChatHistory.chats[appId].messages.push(
                newChatEntry,
                assistantResponse
              );
              // userChatHistory.chats[appId].usage.completion_tokens +=
              //   openaiBody.usage.completion_tokens;
              // userChatHistory.chats[appId].usage.prompt_tokens +=
              //   openaiBody.usage.prompt_tokens - similaritySearchResults;
              // userChatHistory.chats[appId].usage.total_tokens +=
              //   openaiBody.usage.total_tokens - similaritySearchResults;

              await userChatHistoryCollection.updateOne(
                { userId: userID, date: moment().utc().format("YYYY-MM-DD") },
                { $set: { chats: userChatHistory.chats } }
              );
            } else {
              // If no chat history for today exists, create a new entry
              console.log("goes in elseeeeeeeee");

              await userChatHistoryCollection.insertOne({
                userId: userID,
                chatbotId: chatBotId,
                chats: {
                  [`${appId}`]: newChatData,
                },
                date: moment().utc().format("YYYY-MM-DD"),
              });
            }
          } else {
            step = 8;
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
          }
        } else {
          step = 9;
          await client.chat.postMessage({
            channel: channelId,
            text: "You have reached the limit of message count. Please try again later.",
            thread_ts: data.event.ts,
          });
        }
      }
    }
  } catch (error: any) {
    console.log("error", error);
    console.log("step", step);
    //in case if any error occurs with open ai or slack api then decrement the message count
    try {
      step = 10;
      const db = (await clientPromise!)?.db();
      let userDetailsCollection: any = await db.collection("user-details");
      if (updatedMessageCount.isUpdated) {
        await userDetailsCollection.updateOne(
          { userId: updatedMessageCount.userInfo },
          { $inc: { totalMessageCount: -1 } }
        );
      }
    } catch (error: any) {
      console.log("error @", error);
      console.log("step @", step);
    }
  }

  return NextResponse.json({ status: "success" });

  // ________________________________________________________end
}
