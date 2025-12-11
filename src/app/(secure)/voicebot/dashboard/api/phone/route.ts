import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "../../../../../_helpers/server/api/api-handler";
import { generateAndGetToken } from "../../../dashboard/services/vapi-services";
import { VapiClient } from "@vapi-ai/server-sdk";
import clientPromise from "../../../../../../db";
import { ObjectId } from "mongodb";

interface ImportNumberData {
  phoneNumber: string;
  accountSid: string;
  authToken: string;
  label: string;
  userId: string;
}

module.exports = apiHandler({

  POST: importNumberToTwilio,
  GET: getImportedTwilioDataFromDB,
  PUT: updateNumberWithAssistant, //dashboard/api/assistant
  DELETE: deleteSingleAssistant, //dashboard/api/assistant
});
// voicebot/dashboard/api/phone
async function importNumberToTwilio(req: NextRequest) {
  try {
    const data: ImportNumberData = await req.json();
    console.log("Received data:", data);
    // Validate that the data isn't empty
    if (
      !data.phoneNumber ||
      !data.accountSid ||
      !data.authToken ||
      !data.label
    ) {
      return NextResponse.json(
        { message: "Invalid data: All fields are required" },
        { status: 400 }
      );
    }

    // get the jwt token
    const token = await generateAndGetToken();
    console.log("Generated token:", token); //working fine till here.
    const client = new VapiClient({ token });
    const twilioResonse = await client.phoneNumbers.create({
      provider: "twilio",
      number: "+" + data.phoneNumber,
      twilioAccountSid: data.accountSid,
      twilioAuthToken: data.authToken,
    });

    console.log("Twilio response:", twilioResonse);
    const db = (await clientPromise!).db();
    const voiceAssistantCollection = db?.collection(
      "voice-assistance-phone-numbers"
    );

    const result = await voiceAssistantCollection?.insertOne({
      twilio: twilioResonse,
      label: data.label,
      userId: new ObjectId(data.userId),
    });

    return { message: "Data received successfully" };
  } catch (error: any) {
    console.error("Error parsing request body:", error);
    if (error.body) {
      return { message: error.body.message };
    }
    return { message: error };
  }
}

async function getImportedTwilioDataFromDB(req: NextRequest) {
  try {
    const token = await generateAndGetToken();
    console.log("token ", token);
    const userId = req.nextUrl.searchParams.get("userId") as string;
    const db = (await clientPromise!).db();
    const collection = db?.collection("voice-assistance-phone-numbers");
    const importedNumbers = await collection
      ?.find({ userId: new ObjectId(userId) })
      .toArray();
    return { importedNumbers };
  } catch (error: any) {
    return { error: error.message };
  }
}

async function updateNumberWithAssistant(req: NextRequest) {
  try {
    const data: { assistantId: string; twilioId: string } = await req.json();
    const token = await generateAndGetToken();

    //read the twilio data from db
    const db = (await clientPromise!).db();
    const voiceAssistantCollection = db?.collection(
      "voice-assistance-phone-numbers"
    );

    const recordResult = await voiceAssistantCollection?.findOne({
      $or: [
        { "twilio.id": data.twilioId },
        { "vapi.id": data.twilioId }
      ]
    });

    if (!recordResult) {
      return { message: "Twilio record not found!" };
    }

    // if("assistantId" in recordResult){

    //     //update the record with assistantId
    //     const result = await voiceAssistantCollection?.updateOne(
    //         { "twilio.id" : data.twilioId },
    //         { $set: { assistantId: data.assistantId } }
    //     );
    //     console.log('Record updated:', result);
    // }
    // else{
    //     //insert the record with assistantId
    //     const result = await voiceAssistantCollection?.updateOne(
    //         { "twilio.id" : data.twilioId },
    //         { $set: { assistantId: data.assistantId } }
    //     );
    //     console.log('Record updated:', result);
    // }

    // Update Phone Number (PATCH /phone-number/:id)
    const response = await fetch(
      `https://api.vapi.ai/phone-number/${data.twilioId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: "Bearer " + token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // "provider": "twilio",
          assistantId: data.assistantId,
        }),
      }
    );

    const responseBody = await response.json();


    if ("id" in responseBody && "assistantId" in responseBody && responseBody.provider !== "vapi") {
      //update the record with assistantId
      await voiceAssistantCollection?.updateOne(
        { "twilio.id": data.twilioId },
        { $set: { assistantId: data.assistantId } }
      );

      return { message: "Assistant bind with the number" };
    }
    else if (responseBody && responseBody?.provider === "vapi" && "assistantId" in responseBody) {
      await voiceAssistantCollection?.updateOne(
        { "vapi.id": data.twilioId },
        { $set: { "vapi.assistantId": data.assistantId } }
      );

      return { message: "Assistant bind with the number" };

    } else {
      return { message: "Error binding assistant with the number" };
    }
  } catch (error: any) {
    console.error("Error parsing request body:", error);
    return { message: error };
  }
}

async function deleteSingleAssistant(req: NextRequest) {
  try {
    const phoneNumberId = req.nextUrl.searchParams.get(
      "phoneNumberId"
    ) as string;

    const db = (await clientPromise!).db();
    const voiceAssistantCollection = db?.collection(
      "voice-assistance-phone-numbers"
    );
    //find the record
    const recordResult = await voiceAssistantCollection?.findOne({
      _id: new ObjectId(phoneNumberId),
    });

    console.log("Record found:", recordResult);
    //delete the record from twilio
    if (recordResult.twilio) {
      const token = await generateAndGetToken();
      const client = new VapiClient({ token });
      const twilioResonse = await client.phoneNumbers.delete(
        recordResult.twilio.id
      );
      console.log("Twilio response:", twilioResonse);
      if (twilioResonse) {
        //delete the record from the database
        await voiceAssistantCollection?.deleteOne({
          _id: new ObjectId(phoneNumberId),
        });

        return { message: "Record deleted successfully", data: recordResult };
      } else {
        return { message: "Error deleting record from twilio" };
      }
    }
    return { message: "Record not found" };
  } catch (error: any) {
    console.error("Error parsing request body:", error);
    return { message: error };
  }
}
