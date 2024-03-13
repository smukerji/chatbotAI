import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "../../../../../../_helpers/server/api/api-handler";
import clientPromise from "../../../../../../../db";
import { ObjectId } from "mongodb";
export const maxDuration = 300;
async function getChatbotId(telegramToken: any) {
  const db = (await clientPromise!).db();
  const collection = db?.collection("telegram-bot");
  const { chatbotId, userId, isEnabled } = await collection?.findOne({
    telegramToken,
  });
  return { chatbotId, userId, isEnabled };
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

export async function POST(request: NextRequest) {
  let req = await request.json();
  const chatId = req?.message?.chat?.id;
  const telegramToken = request?.nextUrl?.searchParams.get("token");

  // This code is for getting chatbotId from telegram token

  const { chatbotId, userId, isEnabled } = await getChatbotId(telegramToken);

  // -----------------------------------------------------This function will if the subscription is active or not of user
  try {
    const db = (await clientPromise!).db();
    const collection = db?.collection("users");
    const data = await collection.findOne({ _id: new ObjectId(userId) });
    const endDate = data?.endDate;
    // const isTelegram = data?.isWhatsapp;

    const currentDate = new Date();
    if (currentDate > endDate) {
      sendMessageToTelegram(
        telegramToken,
        chatId,
        "Your subscription has ended"
      );
      return new Response("received", { status: 200 });
    } else {
      console.log("continue..");
    }
  } catch (error) {
    console.log("error");
  }

  //----------------------------------------------------------- Now check whether chatbot is enabled or not

  if (isEnabled === false) {
    // return { message: "Chatbot with WhatsApp is disabled" };
    console.log("Chatbot with Telegram is disabled ");
    // return NextResponse.json({ message: "received" });
    return new Response("received", { status: 200 });
  }
  //---------------------------------------------------------- if user types /start
  if (req?.message?.text === "/start") {
    sendMessageToTelegram(
      telegramToken,
      chatId,
      "Welcome how can we help you?"
    );
    return new Response("received", { status: 200 });
  }
  //----------------------------------------------------------- check whether message limit is reached or not
  try {
    const db = (await clientPromise!).db();
    const collections = db?.collection("user-details");
    const result = await collections.findOne({ userId });
    if (result.totalMessageCount >= result.messageLimit) {
      sendMessageToTelegram(
        telegramToken,
        chatId,
        "Your limit reached please upgrade your plan"
      );
      return new Response("received", { status: 200 });
    }
  } catch (error) {
    console.log("error", error);
  }

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
                  
                              query: ${req?.message?.text} `,
            },
          ],
        }),
      }
    );

    const openaiBody = JSON.parse(await responseOpenAI.text());

    //update message count and check message limit

    try {
      const db = (await clientPromise!).db();
      const collections = db?.collection("user-details");
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
    } catch (error) {
      console.log("error ", error);
    }

    // after getting response from open ai
    if (openaiBody.choices[0].message.content) {
      sendMessageToTelegram(
        telegramToken,
        chatId,
        openaiBody.choices[0].message.content
      );
      return new Response("received", { status: 200 });
    }
  }

  return new Response("received", { status: 200 });
}
