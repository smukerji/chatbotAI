import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "../../../../../_helpers/server/api/api-handler";
import clientPromise from "../../../../../../db";
import { ObjectId } from "mongodb";

module.exports = apiHandler({
  DELETE: deleteWhatsappData,
  GET: getWhatsappData,
  PUT: enableDisableToggle,
});

async function deleteWhatsappData(req: NextRequest) {
  //read the Object from the request
  let whatsAppId: any = req.nextUrl.searchParams.get("whatsAppDetailsId");
  const db = (await clientPromise!).db();
  const collection = db?.collection("whatsappbot_details");
  const deleteResult = await collection?.findOne({
    _id: new ObjectId(whatsAppId),
  });

  if (deleteResult) {
    let result = await collection?.deleteOne({ _id: new ObjectId(whatsAppId) });

    if (result?.deletedCount > 0) {
      return { message: "success" };
    }
    return { message: "error" };
  }

  return { message: "error" };
}

// @ErrorHandler
async function getWhatsappData(req: NextRequest) {
  let chatBotId: any = req.nextUrl.searchParams.get("chatBotId");
  const db = (await clientPromise!).db();
  const collection = db?.collection("whatsappbot_details");
  const foundResult = await collection?.findOne({ chatbotId: chatBotId });

  if (foundResult) {
    return foundResult;
  }

  return { message: "error" };
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
