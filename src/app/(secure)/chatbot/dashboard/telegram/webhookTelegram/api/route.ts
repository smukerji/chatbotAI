import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "../../../../../../_helpers/server/api/api-handler";
import { connectDatabase } from "../../../../../../../db";

async function getChatbotId(telegramToken: any) {
  const db = (await connectDatabase())?.db();
  const collection = db?.collection("telegram-bot");
  const { chatbotId, userId,isEnabled } = await collection?.findOne({ telegramToken });
  return { chatbotId, userId,isEnabled };
}



export async function POST(request: NextRequest) {
  let req = await request.json();
  const chatId = req?.message?.chat?.id;
  const telegramToken = request?.nextUrl?.searchParams.get("token");

  // This code is for getting chatbotId from telegram token

  const { chatbotId, userId,isEnabled } = await getChatbotId(telegramToken);

    // Now check whether chatbot is enabled or not 
  
    if(isEnabled === false){
        // return { message: "Chatbot with WhatsApp is disabled" };
        console.log('Chatbot with Telegram is disabled ')
        // return NextResponse.json({ message: "received" });
        return new Response("received", { status: 200 });
      }
      if(req?.message?.text === '/start'){
         //--------------- This code is for sending message to telegram
      const url = `https://api.telegram.org/bot${telegramToken}/sendMessage`;

      const body = {
        chat_id: chatId,
        text: 'Welcome to our chatbot . How can we help you?',
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
        return new Response("received", { status: 200 });
      }
      // check whether message limit is reached or not 
      try {
        const db = (await connectDatabase())?.db();
        const collections = db?.collection("user-details");
        const result = await collections.findOne({ userId });
        if(result.totalMessageCount >= result.messageLimit){
           //--------------- This code is for sending message to telegram
      const url = `https://api.telegram.org/bot${telegramToken}/sendMessage`;

      const body = {
        chat_id: chatId,
        text: 'Your limit reached please upgrade your plan',
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
      return new Response("received", { status: 200 });
        }
        
      } catch (error) {
        console.log("error",error)
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
      const db = (await connectDatabase())?.db();
      const collections = db?.collection("user-details");
      const result = await collections.findOne({ userId });
      if (result?.totalMessageCount !== undefined && openaiBody.choices[0].message.content) {
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
      //--------------- This code is for sending message to telegram
      const url = `https://api.telegram.org/bot${telegramToken}/sendMessage`;

      const body = {
        chat_id: chatId,
        text: openaiBody.choices[0].message.content,
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
  }

  return new Response("received", { status: 200 });

}
