import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
// import { NextApiResponse } from "next";
import { connectDatabase } from "@/db";

export async function GET(req: NextRequest) {
  let hubMode = req.nextUrl.searchParams.get("hub.mode");
  let hubChallenge = req.nextUrl.searchParams.get("hub.challenge");
  let hubToken = req.nextUrl.searchParams.get("hub.verify_token");

  if (
    hubMode === "subscribe" &&
    hubToken === process.env.WHATSAPPCALLBACKTOKEN
  ) {
    return new Response(hubChallenge);
  }

  return new Response("Invalid Credentials", { status: 400 });
}

// WhatsApp will triger this post request once user asked question to bot and also response to the user
export async function POST(req: NextRequest) {
  let res: any = await req.json();

  let questionFromWhatsapp =
    res?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.text?.body; // question received from whatsapp

  if (questionFromWhatsapp == undefined || questionFromWhatsapp.trim().length <= 0) { //if the request is only about status don't move further
    return NextResponse.json({ message: "status received" });
  }

  let chatbotId = req.nextUrl.pathname.split("api/")[1]; //here you will recieved the chatbot unique id, based on this you would identify knowledge base
  const responseNumber = res?.entry?.[0]?.changes?.[0]?.value?.contacts[0]?.wa_id;

  // retriving userId from database
  try {
    const db = (await connectDatabase()).db();

    const collection = db.collection("user-chatbots");
    const cursor = await collection.findOne({
      chatbotId: "",
    });
    const userID = cursor.userId;

    // if we have user id
    const response: any = await fetch(
      `${process.env.NEXT_PUBLIC_WEBSITE_URL}api/pinecone`,
      {
        method: "POST",
        body: JSON.stringify({
          userQuery: questionFromWhatsapp,
          chatbotId: "",
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
                
                            query: ${questionFromWhatsapp} `,
            },
          ],
        }),
      }
    );

    const openaiBody = JSON.parse(await responseOpenAI.text());

    // after getting response from open ai
    if (openaiBody.choices[0].message.content) {
      const version = "v18.0"; // Replace with your desired version
      const phoneNumberId = process.env.WHATSAPPPHONENUMBERID; // Replace with your phone number ID
      const recipientPhoneNumber = '+'+responseNumber;
      const accessToken = process.env.WHATSAPPTOKEN

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
            body: openaiBody.choices[0].message.content
        }
    };

      // Define the options for the fetch request
      const options = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}` 
        },
        body: JSON.stringify(data),
      };
      // Make the POST request using fetch
      fetch(url, options)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          return response.json();
        })
        .then((data) => {
          
        })
        .catch((error) => {
        });
    }
  } catch (error:any) {
    //mantain the error log in database, in case of unhandle error
  }

  return NextResponse.json({ message: "received" });
}
