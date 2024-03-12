import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "../../../../../_helpers/server/api/api-handler";
import clientPromise from "../../../../../../db";
import { ObjectId } from "mongodb";
import { CHATBOTNOTAVAILBLE, ERROR_ON_DELETE, INVALIDCHATBOTID, INVALIDWHATSAPPDETAILSID, WHATSAPPDETAILNOTFOUND } from "@/app/_helpers/errorConstants";

module.exports = apiHandler({
  DELETE: deleteWhatsappData,
  GET: getWhatsappData,
  PUT: enableDisableToggle,
});

async function deleteWhatsappData(req: NextRequest) {

  try {
    //read the Object from the request, if not available then return error
    let whatsAppId: any = req.nextUrl.searchParams.get("whatsAppDetailsId");
    if (!whatsAppId) {
      return { message: INVALIDWHATSAPPDETAILSID, status: 403 };
    }

    //connect to database
    const db = (await clientPromise!).db();

    //checking if given whatsapp details is available or not
    const collection = db?.collection('whatsappbot_details');
    const deleteResult = await collection?.findOne({ _id: new ObjectId(whatsAppId) });
    //once record found then delete it
    if (deleteResult) {
      let result = await collection?.deleteOne({ _id: new ObjectId(whatsAppId) });

      if (result?.deletedCount > 0) {
        return { message: "success" };
      }
      else {
        return {
          message: ERROR_ON_DELETE,
          status: 500
        }
      }
    }
    //if no record found then return error
    return {
      message: WHATSAPPDETAILNOTFOUND,
      status: 404
    }
  }
  catch (error: any) {
    console.error(error);
    return { message: error.message, status: 500 };
  }

}

// @ErrorHandler
async function getWhatsappData(req: NextRequest) {

  try {
    let chatBotId: any = req.nextUrl.searchParams.get("chatBotId");
    //if chatbot id is not available then return error
    if (!chatBotId) {
      return { message: INVALIDCHATBOTID, status: 403 };
    }

    //connect to database
    const db = (await clientPromise!).db();

    //checking if given chatbot is available or not
    const userChatbotCollection = db?.collection('user-chatbots');
    const userChatbot = await userChatbotCollection?.findOne({ chatbotId: chatBotId });
    if (!userChatbot) {
      return { message: CHATBOTNOTAVAILBLE, status: 404 };
    }

    const collection = db?.collection('whatsappbot_details');
    const foundResult = await collection?.findOne({ chatbotId: chatBotId });

    if (foundResult) {
      return foundResult;
    }
    else {
      return { message: WHATSAPPDETAILNOTFOUND, status: 404 };
    }
  }
  catch (error: any) {
    console.error(error);
    return { message: error.message, status: 500 };
  }

}

//put request for enable/disable
async function enableDisableToggle(req: NextRequest) {
  try {
    let whatsAppDetailsId: any =
      req.nextUrl.searchParams.get("whatsappDetailsId");
    const db = (await clientPromise!).db();
    const collection = db?.collection("whatsappbot_details");
    const foundResult = await collection?.findOne({
      _id: new ObjectId(whatsAppDetailsId),
    });

    if (foundResult) {
      let result = await collection?.updateOne(
        { _id: new ObjectId(whatsAppDetailsId) },
        { $set: { isEnabled: !foundResult.isEnabled } }
      );

      if (result?.modifiedCount > 0) {
        return { message: "success" };
      }
      return { message: "error" };
    }

    return { message: "error" };
  } catch (error: any) {
    console.error(error);
    return { message: "error", error: error.message };
  }
}
