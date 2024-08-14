import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  let hubMode = req.nextUrl.searchParams.get("hub.mode");
  let hubChallenge = req.nextUrl.searchParams.get("hub.challenge");
  let hubToken = req.nextUrl.searchParams.get("hub.verify_token");

  const PAGE_ACCESS_TOKEN =
    "EAANR0Mh3zkMBO2wiMQAyasJcC18kClLIXA8bqF1XMo2yPEnnj7RT2G2D9kZATAvZBSiIz9Jinl4cZCeLn6LHyUhPpW2B4WZBpiFDkXMLiZAWbdyZBy2nLWNVPDskIV1IHZAcSe8cd1Ct4p1DTMTXYQI5ePUy3YGgEaN3XRxty0GZBzCoDJfE6rUxrk0IUzsOPNaQ5vbUqKPp";

  // const db = (await clientPromise!).db();
  // const collection = db?.collection("whatsappbot_details");
  // //find the token in database
  // const tokenDetails = await collection?.findOne({
  //   webhook_verification_token: hubToken,
  // });
  if (
    hubMode === "subscribe" &&
    hubToken === "instagramtoken"
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
  console.log("coming in hereeee");

  const body = await req.json();

  if (body.object === "instagram") {
    body.entry.forEach(async (entry: any) => {
      console.log(
        entry.messaging[0].sender,
        entry.messaging[0].recipient,
        entry.messaging[0].message,
        ">>>>>>>"
      );

      entry.messaging.forEach(async (change: any) => {
        const senderId = change.sender.id;
        const message = change.message;

        console.log("Sender ID:", senderId);

        if (message) {
          await handleInstagramMessage(senderId, message);
        }
      });
    });

    return new Response("EVENT_RECEIVED", { status: 200 });
  }

  return new Response("404 Not Found", { status: 404 });
}

// Function to handle incoming Instagram messages
async function handleInstagramMessage(senderId: string, message: string) {
  let response;

  if (message) {
    response = {
      text: `Hello, How can I help you?`,
    };
  } else {
    response = {
      text: `We only support text messages for now.`,
    };
  }

  await callSendAPI(senderId, response);
}

// Function to handle postbacks (if any)
// async function handlePostback(senderPsid: number, receivedPostback: any) {
//   let response;

//   // Handle postback here

//   await callSendAPI(senderPsid, response);
// }

// Function to send messages via the Instagram Graph API
async function callSendAPI(senderId: string, response: any) {
  const PAGE_ACCESS_TOKEN =
    "EAANR0Mh3zkMBOZBlvNh0LLCHcrdowj7zrIkUc27GYeIQnVMa6ZAokPBlYzmKoECminZBZAe3QQDF5lcn6kGQR2JZCyZBHBZBp91XIcS0MTeCZCo7ZCZCi2mZAryIqwMZAFOGuRobZATcZCQgmzX6ZAdJRtgZAXB6v7JRa8rRbqrZCnUteIig3Df1GEIisu5PUpLpaZBeMNuuPaTOir1kQG";

  const requestBody = {
    recipient: {
      id: senderId,
    },
    message: response,
  };

  const res = await fetch(
    `https://graph.facebook.com/v19.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
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
