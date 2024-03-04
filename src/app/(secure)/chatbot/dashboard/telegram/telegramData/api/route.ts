import { NextRequest } from "next/server";
import { apiHandler } from "../../../../../../_helpers/server/api/api-handler";
import { connectDatabase } from "../../../../../../../db";

module.exports = apiHandler({
  GET:getAllTelegramDetails,
  POST: setTelegramToken,
  DELETE:deleteTelegramToken,
  PUT:editTelegramToken
});

//This function will get all details of telegram
async function getAllTelegramDetails(request: NextRequest) {
  try {
    const chatbotId: any = request.nextUrl.searchParams.get("chatbotId");
    if (!chatbotId) {
      return { message: "chatbotId parameter is missing", status: 400 };
    }

    const db = (await connectDatabase())?.db();
    if (!db) {
      return { message: "Failed to connect to the database", status: 500 };
    }

    const collection = db.collection('telegram-bot');
    const data = await collection.findOne({ chatbotId });
    if (!data) {
      return { message: "No data found for the specified chatbotId", status: 404 };
    }

    return { data,status:200};
  } catch (error) {
    console.error("An error occurred while fetching Telegram details:", error);
    return { message: "Internal server error", status: 500 };
  }
}






//This function will delete telegram token
async function deleteTelegramToken(request: NextRequest){
  const chatbotId:any = request.nextUrl.searchParams.get("chatbotId")
  const db = (await connectDatabase())?.db();
  const collection = db?.collection('telegram-bot');
  const deleteResult = await collection?.findOne({ chatbotId });
  if (deleteResult) {
    let result = await collection?.deleteOne({ chatbotId });

    if(result?.deletedCount > 0){
      return { message: "deleted successfully",status:200 };
    }
    return { message: "error",status:400 };  
 
  }

  return { message: "error",status:400 };

}

//This function will edit enable in telegram record
async function editTelegramToken(request: NextRequest) {
  const requestBody = await request.json(); // Assuming the request body is JSON
  const { chatbotId, isEnabled } = requestBody;
  
  if (!chatbotId || isEnabled === undefined) {
    return { message: "chatbotId or isEnabled field missing in the request body", status: 400 };
  }
  
  const db = (await connectDatabase())?.db();
  const collection = db?.collection('telegram-bot');
  const updateResult = await collection?.updateOne(
    { chatbotId },
    { $set: { isEnabled } }
  );
  
  if (updateResult?.modifiedCount && updateResult.modifiedCount > 0) {
    return { message: "Success", status: 200 };
  } else {
    return { message: "Error editing record", status: 400 };
  }
}




//This function will set telegram token 
async function setTelegramToken(request: NextRequest) {
  const { chatbotId, telegramToken, userId,isEnabled } = await request.json();

  const db = (await connectDatabase())?.db();
  const collection = db?.collection("telegram-bot");

  // step 1: First check whether telegram token is present in db or not
  const isTokenPresent = await checkTokenInDatabase(telegramToken, collection);
  if (isTokenPresent) {
    const isCurrentUsersToken = await checkCurrentUserToken(
      userId,
      collection,
      telegramToken
    );
    if (isCurrentUsersToken) {
      // Token belongs to the current user
      // Check if the token belongs to the same chatbot
      const tokenRecord = await collection.findOne({ telegramToken });
      if (tokenRecord && tokenRecord.chatbotId === chatbotId) {
        return { status: 200, message: "Token already linked to this chatbot" };
      } else {
        return {
          status: 403,
          message: "Token already linked to another chatbot",
        };
      }
    } else {
      // Token does not belong to the current user
      return {
        status: 403,
        message: "Token already linked to a different user chatbot",
      };
    }
  } else {
    // Check if the chatbot is already linked to another token
    const existingToken = await collection.findOne({ chatbotId });
    if (existingToken) {
      return {
        status: 403,
        message: "Chatbot already linked to another token",
      };
    } else {
      try {
        const result = await collection.insertOne({
          chatbotId,
          telegramToken,
          userId,
          isEnabled
        });
        // Handle successful insertion
        return { status: 200, message: "Telegram integrated successfully" };
      } catch (error: any) {
        // Handle any errors that occur during insertion
        return { status: 500, message: "error", error: error.message };
      }
    }
  }
}
// This function will check if this token is of the current user or not
async function checkCurrentUserToken(
  userId: any,
  collection: any,
  telegramToken: any
) {
  const tokenRecord = await collection.findOne({ userId, telegramToken });
  return tokenRecord !== null;
}

// This function will check if token is present in db or not
async function checkTokenInDatabase(telegramToken: any, collection: any) {
  const isTokenPresent = await collection.findOne({ telegramToken });
  return isTokenPresent !== null;
}
