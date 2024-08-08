import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  let hubMode = req.nextUrl.searchParams.get("hub.mode");
  let hubChallenge = req.nextUrl.searchParams.get("hub.challenge");
  let hubToken = req.nextUrl.searchParams.get("hub.verify_token");

  const PAGE_ACCESS_TOKEN =
    "EAANR0Mh3zkMBO3hwwnDVhu6lZCSzTlkH6cngDpovapnFFEoyQORgjr3phdl7VZC3uptzsYY0QDl1xD8VCY6gRd03SLpUMwnuDevKJEe9UTYhR1cNinCd1dFZANoqdApO28U1ca4T54rCtxcVZAZBFrbT6YqoC1ej91PlVWjw8v2HrksCchSTXVaZCTzTCZBmn5Mw0jRrzAZB";

  // const db = (await clientPromise!).db();
  // const collection = db?.collection("whatsappbot_details");
  // //find the token in database
  // const tokenDetails = await collection?.findOne({
  //   webhook_verification_token: hubToken,
  // });
  if (
    hubMode === "subscribe" &&
    hubToken === "messengertoken"
    // hubToken === process.env.WHATSAPPCALLBACKTOKEN
  ) {
    // find whome the hubToken belongs to and update the isTokenVerified to true
    //   const tokenDetails = await collection?.findOne({
    //     webhook_verification_token: hubToken,
    //   });
    //   if (tokenDetails) {
    //     await collection?.updateOne(
    //       { webhook_verification_token: hubToken },
    //       { $set: { isTokenVerified: true } }
    //     );
    //   }

    console.log("verified successfully");
    return new Response(hubChallenge);
  }
  console.log("->>>>>>>>>>>>>>>>>>");
  return new Response("Invalid Credentials", { status: 400 });
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (body.object === "page") {
    body.entry.forEach(async (entry: any) => {
      const webhookEvent = entry.messaging[0];
      const senderPsid = webhookEvent.sender.id;

      console.log("Sender PSID:", senderPsid);

      if (webhookEvent.message) {
        await handleMessage(senderPsid, webhookEvent.message);
      }
      // else if (webhookEvent.postback) {
      //   await handlePostback(senderPsid, webhookEvent.postback);
      // }
    });

    return new Response("EVENT_RECEIVED", { status: 200 });
  }

  return new Response("404 Not Found", { status: 404 });
}

// Function to handle incoming messages
async function handleMessage(senderPsid: number, receivedMessage: any) {
  let response;

  if (receivedMessage.text) {
    response = {
      text: `Hello, How can I help you?`,
    };
  } else if (receivedMessage.attachments) {
    response = {
      text: `We only support text messages for now.`,
    };
  }

  await callSendAPI(senderPsid, response);
}

// Function to handle postbacks (if any)
// async function handlePostback(senderPsid: number, receivedPostback: any) {
//   let response;

//   // Handle postback here

//   await callSendAPI(senderPsid, response);
// }

// Function to send messages via the Facebook Graph API
async function callSendAPI(senderPsid: number, response: any) {
  const PAGE_ACCESS_TOKEN =
    "EAANR0Mh3zkMBO3l6KZCc3RSWpuz7LEyhMuVCBZACaxA5byfWvZBtcL0DXVFboufDz7u2KA4PmHTylGdZBLwZBCJ8UeJAUqAC90vnQZAEZCgVY9tkcTtiJR30Y57bvSkF3rbZBZC3h6YBuwSHYqZBXGd4u90C7R8awJh7K58rp7VdkFMPq87xoX9tgvtPEX9bc03u4t2gpy4tZAk";

  const requestBody = {
    recipient: {
      id: senderPsid,
    },
    message: response,
  };

  const res = await fetch(
    `https://graph.facebook.com/v20.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    }
  );

  if (!res.ok) {
    console.error("Unable to send message:", await res.text());
  } else {
    console.log("Message sent!");
  }
}
