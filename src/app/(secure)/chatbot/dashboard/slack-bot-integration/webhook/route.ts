import { connectDatabase } from "@/db";
import { NextRequest, NextResponse } from "next/server";
const { WebClient, LogLevel } = require("@slack/web-api");

interface SlackAppData {
  appId:string;
  userId:string;
  authOToken:string;
  chatBotId:string;
}

export async function POST(req: NextRequest) {

  try {

    let retryNum = req.headers.get('X-Slack-Retry-Num');
    //if retryNum is available then return the response with status 200
    if (retryNum) {
      return new NextResponse('', { status: 200 });
    }
    //read the incomming parameter from webhook
    let resData: any = await req.json();
    // return the challenge on first time verification
    if (resData.challenge) {
      return new NextResponse(JSON.stringify({ challenge: resData.challenge }), { status: 200 });
    }
    else {
      if (resData.event.type === 'app_mention') {

        setImmediate(async () => {
          await writeInDataBase(resData);
        });

        return new NextResponse('', { status: 200 });
      }
      else {
        //handle else part here.
      }
    }

  }
  catch (error: any) {
    console.log('error', error);
  }

}


async function writeInDataBase(data: any) {

  let updatedMessageCount: { isUpdated: boolean, updatedResult: any, userInfo: any } = {
    isUpdated: false,
    updatedResult: null,
    userInfo: null
  }

  try {

    const appId = data.api_app_id;
    const channelId = data.event.channel;

    //find is AppId is available
    const db = (await connectDatabase())?.db();
    let slackCollection = db.collection('slack-app-details');

    let appDetails: SlackAppData = await slackCollection.findOne({ appId: appId });
    if (appDetails) {
      const authOToken = appDetails.authOToken;
      const chatBotId = appDetails.chatBotId;
      const message = data.event.text.replace(/<@.*?>\s*\n?/, '');
      const userID = appDetails.userId;

      const client = new WebClient(authOToken, {
        // LogLevel can be imported and used to make debugging simpler
        logLevel: LogLevel.DEBUG
      });

      //if message is empty then return the message      
      if (message.length === 0) {
        await client.chat.postMessage({
          channel: channelId,
          text: "I guess you sent me an empty message.",
          threadId: data.event.ts
        });

        return new NextResponse('', { status: 200 });
      }
      else {

        //check if user chat count has reached the limit if not then increment the count
        let userDetailsCollection: any = await db.collection('user-details');
        let cursor = await userDetailsCollection.aggregate([
          {
            $match: { userId: userID }
          },
          {
            $addFields: {
              limitCross: {
                $cond: [
                  {
                    $gte: [
                      "$totalMessageCount", "$messageLimit"
                    ]
                  }, true, false
                ]
              }
            }
          }
        ]);

        let limitCrossResult = await cursor.toArray();

        await cursor.close();
        //if limitCross is false then increment the message count
        if (limitCrossResult[0].limitCross === false) {

          //increment the message count
          let updatedResult =  await userDetailsCollection.updateOne({ userId: userID }, { $inc: { totalMessageCount: 1 } });
          if(updatedResult.modifiedCount > 0){
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

          // after getting response from open ai send the response to slack
          if (openaiBody.choices[0].message.content) {
            await client.chat.postMessage({
              channel: channelId,
              text: openaiBody.choices[0].message.content,
              thread_ts: data.event.ts
            });

            return new NextResponse('', { status: 200 });

          }
          else {

            //if update result is true and open ai didn't respond then decrement the message count
            if(updatedMessageCount.isUpdated){
              await userDetailsCollection.updateOne({ userId: userID }, { $inc: { totalMessageCount: -1 } });
            }

            //if open ai didn't respond then send the message to slack
            await client.chat.postMessage({
              channel: channelId,
              text: "Lucifer AI is not able to answer for your query. Please try again later.",
              thread_ts: data.event.ts
            });

            return new NextResponse('', { status: 200 });
          }
        }
        else {
          await client.chat.postMessage({
            channel: channelId,
            text: "You have reached the limit of message count. Please try again later.",
            thread_ts: data.event.ts
          });
          return new NextResponse('', { status: 200 });
        }
      }
    }

  }
  catch (error: any) {
    //in case if any error occurs with open ai or slack api then decrement the message count
    try {
      const db = (await connectDatabase())?.db();
      let userDetailsCollection: any = await db.collection('user-details');
      if (updatedMessageCount.isUpdated) {
        await userDetailsCollection.updateOne({ userId: updatedMessageCount.userInfo }, { $inc: { totalMessageCount: -1 } });
      }

    }
    catch (error: any) {
      console.log('error', error);
    }
   
  }

}