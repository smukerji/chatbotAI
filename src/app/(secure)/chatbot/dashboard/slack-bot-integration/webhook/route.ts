import clientPromise from "@/db";
import { NextRequest, NextResponse } from "next/server";
import { threadId } from "worker_threads";
const { WebClient, LogLevel } = require("@slack/web-api");

interface SlackAppData {
  appId: string;
  userId: string;
  authOToken: string;
  chatBotId: string;
}

export async function POST(req: NextRequest) {
  try {
    //read the incomming parameter from webhook
    let resData: any = await req.json();

    // return new NextResponse('', { status: 200 });
    if (resData.challenge) {
      // return new Response(JSON.stringify({ challenge: resData.challenge }), { status: 200 });
      return new NextResponse(
        JSON.stringify({ challenge: resData.challenge }),
        { status: 200 }
      );
    } else {
      if (resData.event.type === "app_mention") {
        //  console.log('app_mention',resData.event);
        //  console.log('app_mention',resData.event.text);

        //  slackEventsQueue.add({ event: resData });
        writeInDataBase(resData);
        return new NextResponse("", { status: 200 });

        //  return new Response('', { status: 200 });
      }
    }

    //find the token in database
    // const tokenDetails = await collection?.findOne({ webhook_verification_token: hubToken });
    // if (
    //   hubMode === "subscribe" &&
    //   hubToken === tokenDetails?.webhook_verification_token
    //   // hubToken === process.env.WHATSAPPCALLBACKTOKEN
    // ) {

    //   // find whome the hubToken belongs to and update the isTokenVerified to true
    //   const tokenDetails = await collection?.findOne({ webhook_verification_token: hubToken });
    //   if (tokenDetails) {
    //     await collection?.updateOne({ webhook_verification_token: hubToken }, { $set: { isTokenVerified: true } });
    //   }

    //   console.log('verified successfully');
    //   return new Response(hubChallenge);
    // }

    // return new Response("Invalid Credentials", { status: 400 });
  } catch (error: any) {
    console.log("error", error);
  }
}

async function writeInDataBase(data: any) {
  try {
    const appId = data.api_app_id;
    const channelId = data.event.channel;

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

        if (limitCrossResult[0].limitCross === false) {
          let isUpdated = false;
          //increment the message count
          let updatedResult = await userDetailsCollection.updateOne(
            { userId: userID },
            { $inc: { totalMessageCount: 1 } }
          );
          if (updatedResult.modifiedCount > 0) {
            isUpdated = true;
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
              thread_ts: data.event.ts,
            });
          } else {
            //if update result is true and open ai didn't respond then decrement the message count
            if (isUpdated) {
              await userDetailsCollection.updateOne(
                { userId: userID },
                { $inc: { totalMessageCount: -1 } }
              );
            }

            await client.chat.postMessage({
              channel: channelId,
              text: "Lucifer AI is not able to answer for your query. Please try again later.",
              thread_ts: data.event.ts,
            });
          }
        } else {
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
  }
}