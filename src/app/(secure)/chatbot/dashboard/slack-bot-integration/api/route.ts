import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "../../../../../_helpers/server/api/api-handler";
import clientPromise from "../../../../../../db";
import validator from "validator";
import { ObjectId } from "mongodb";

module.exports = apiHandler({
  POST: saveSlackAppData,
  GET: getSlackAppData,
  DELETE: deleteSlackAppData,
});

interface SlackAppData {
  _id?: string;
  appId: string;
  userId: string;
  authOToken: string;
  chatBotId: string;
}

async function deleteSlackAppData(req: NextRequest) {
  try {
    let recordId: string = req.nextUrl.searchParams.get("recordId") as string;

    if (validator.isEmpty(recordId.trim())) {
      return { status: 400, message: "Invalid recordId" };
    }

    const db = (await clientPromise!)?.db();
    const collection = db?.collection("slack-app-details");
    const deleteResult = await collection?.findOne({
      _id: new ObjectId(recordId),
    });

    if (deleteResult) {
      let result = await collection?.deleteOne({ _id: new ObjectId(recordId) });

      if (result?.deletedCount > 0) {
        return { message: "delete success" };
      }
      return { message: "delete failed" };
    }

    return { message: "data not found", status: 404 };
  } catch (error: any) {
    return { status: 503, message: error.message };
  }
}

async function getSlackAppData(req: NextRequest) {
  try {
    //read the chatBotId
    let chatBotId: any = req.nextUrl.searchParams.get("chatBotId");
    //if not valid chatBotId then return error
    if (!validator.isUUID(chatBotId)) {
      return { status: 400, message: "Invalid chatBotId" };
    }

    const db = (await clientPromise!)?.db();
    let slackCollection: any = db.collection("slack-app-details");
    let appDetails: SlackAppData = await slackCollection.findOne({
      chatBotId: chatBotId,
    });
    // throw new Error('Unhandle exceptions');

    if (!appDetails) {
      return { status: 400, message: "No slack app found" };
    }

    return { message: "Details received.", data: appDetails };
  } catch (error: any) {
    return { status: 503, message: error.message };
  }
}

async function saveSlackAppData(req: NextRequest) {
  try {
    let slackAppData: SlackAppData = await req.json();
    console.log("slackAppData", slackAppData);
    const db = (await clientPromise!)?.db();

    //check if the chatBotId is exist
    let chatbotCollection = db.collection("user-chatbots");
    let chatBotDetails = await chatbotCollection.findOne({
      chatbotId: slackAppData.chatBotId,
    });
    if (!chatBotDetails) {
      return { status: 400, message: "Chatbot not available" };
    }

    //check if the user is exist
    let userCollection = db.collection("users");
    let userDetails = await userCollection.findOne({
      _id: new ObjectId(slackAppData.userId),
    });
    if (!userDetails) {
      return { status: 400, message: "User not available" };
    }

    let collection = db.collection("slack-app-details");

    //find if the app is already registered
    let appDetails = await collection.findOne({ appId: slackAppData.appId });
    if (appDetails) {
      //update the app details
      await collection.updateOne(
        { appId: slackAppData.appId },
        { $set: slackAppData }
      );
    } else {
      //insert the app details
      await collection.insertOne(slackAppData);
    }

    return { message: "Your slack connected!" };
  } catch (error: any) {
    return { status: 400, message: error.message };
  }
}
