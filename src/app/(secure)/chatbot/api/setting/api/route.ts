import { NextRequest } from "next/server";
import { apiHandler } from "../../../../../_helpers/server/api/api-handler";
import { NextApiRequest } from "next";
import clientPromise from "../../../../../../db";
import { getDate } from "../../../../../_helpers/client/getTime";
import joi from "joi";
import { authOptions } from "../../../../../api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import { openai } from "@/app/openai";

module.exports = apiHandler({
  POST: retriveChatbotSettings,
  PUT: updateChatbotSettings,
});

type ChatData = {
  messages: any[]; // Replace `any[]` with the actual type if possible
  sessionStartDate: string;
  sessionEndDate: string;
};

type Chats = {
  [key: string]: ChatData;
};

async function retriveChatbotSettings(request: NextRequest) {
  /// get the session and then access the id
  const session: any = await getServerSession(authOptions);
  const userId = request?.headers.get("userId")
    ? request?.headers.get("userId")
    : session?.user?.id;
  const body = await request.json();
  // Accessing chatbotId from body
  const chatbotId = body?.chatbotId;

  const db = (await clientPromise!).db();
  const collection = db.collection("chat-history");

  const cursor = await collection.find({
    userId: userId,
    chatbotId: chatbotId,
  });

  const data = await cursor.toArray();

  /// close the cursor
  await cursor.close();

  /// filter data
  let today: any = {};
  let yesterday: any = {};
  let lastSevenDay: any = {};
  let moreThanLastSevenDay: any = {};

  const todaysDate: any = new Date(getDate().split(" ")[0].replace(/\//g, "-"));

  ///  the number of milliseconds in a yesterday
  const yesterDayInMillis = 24 * 60 * 60 * 1000;

  ///  the number of milliseconds in a last 7 days
  const sevenDayInMillis = 24 * 60 * 60 * 1000 * 6;

  ///  the number of milliseconds in a more than last 7 days
  const moreThanSevenDayInMillis = 24 * 60 * 60 * 1000 * 7;
  data?.forEach((obj: any) => {
    const date: any = new Date(obj.date.replace(/\//g, "-"));

    // Calculate the difference in milliseconds
    const timeDiff = Math.abs(date - todaysDate);

    /// get today chat conversation
    if (timeDiff == 0) today["chats"] = obj.chats;
    /// get yesterday chat conversation
    else if (timeDiff == yesterDayInMillis) yesterday["chats"] = obj.chats;
    /// get last 7 days chat conversation
    else if (timeDiff > yesterDayInMillis)
      lastSevenDay["chats"] = { ...lastSevenDay["chats"], ...obj.chats };
    /// get more than last 7 days chat conversation
    else if (timeDiff > sevenDayInMillis)
      moreThanLastSevenDay["chats"] = {
        ...moreThanLastSevenDay["chats"],
        ...obj.chats,
      };
  });

  return {
    chatHistory: { today, yesterday, lastSevenDay, moreThanLastSevenDay },
  };
}

async function updateChatbotSettings(request: NextRequest) {
  /// get the session and then access the id
  const session: any = await getServerSession(authOptions);
  const userId = request?.headers.get("userId")
    ? request?.headers.get("userId")
    : session?.user?.id;

  const body = await request.json();
  // Accessing chatbotId from body
  const chatbotId = body?.chatbotId;

  /// Chatbot name if renaming is present
  const chatbotRename = body?.chatbotRename;

  const db = (await clientPromise!).db();
  /// if rename is not ""
  if (chatbotRename !== "" && chatbotRename !== undefined) {
    const collection = db.collection("user-chatbots");

    /// update the name
    await collection.updateOne(
      {
        userId: userId,
        chatbotId: chatbotId,
      },
      { $set: { chatbotName: chatbotRename } }
    );

    /// update chatbot name using assistant api
    try {
      const assistant = await openai.beta.assistants.update(chatbotId, {
        name: chatbotRename,
      });
    } catch (error) {
      console.log("Error while updating assistant name", error);
    }
  } else {
    /// update the chatbot settings table
    const {
      model,
      visibility,
      temperature,
      numberOfCharacterTrained,
      instruction,
      initialMessage,
      suggestedMessages,
      messagePlaceholder,
      theme,
      userMessageColor,
      chatbotIconColor,
      tempprofilePictureUrl,
      tempbubbleIconUrl,
      lastTrained,
      chatbotBubbleAlignment,
      tempprofilePictureName,
      tempbubbleIconName,
      chatbotDisplayName,
      leadTitle,
      userDetails,
      leadFields,
      botVisibility,
      rateLimit,
      rateLimitMessage,
      rateLimitTime,
      allowIframe,
    } = body;

    /// extract only the field that need to be updated
    const updateFields = {
      ...(model !== undefined && { model }),
      ...(visibility !== undefined && { visibility }),
      ...(temperature !== undefined && { temperature }),
      ...(numberOfCharacterTrained !== undefined && {
        numberOfCharacterTrained,
      }),
      ...(instruction !== undefined && { instruction }),
      ...(initialMessage !== undefined && { initialMessage }),
      ...(suggestedMessages !== undefined && { suggestedMessages }),
      ...(messagePlaceholder !== undefined && { messagePlaceholder }),
      ...(theme !== undefined && { theme }),
      ...(userMessageColor !== undefined && { userMessageColor }),
      ...(chatbotIconColor !== undefined && { chatbotIconColor }),
      ...(tempprofilePictureUrl !== undefined && {
        profilePictureUrl: tempprofilePictureUrl,
      }),
      ...(tempbubbleIconUrl !== undefined && {
        bubbleIconUrl: tempbubbleIconUrl,
      }),
      ...(lastTrained !== undefined && { lastTrained }),
      ...(tempprofilePictureName !== undefined && {
        profilePictureName: tempprofilePictureName,
      }),
      ...(tempbubbleIconName !== undefined && {
        bubbleIconName: tempbubbleIconName,
      }),
      ...(chatbotDisplayName !== undefined && {
        chatbotDisplayName,
      }),
      ...(chatbotBubbleAlignment !== undefined && { chatbotBubbleAlignment }),
      ...(leadTitle !== undefined && { leadTitle }),
      ...(userDetails !== undefined && { userDetails }),
      ...(leadFields !== undefined && { leadFields }),
      ...(botVisibility !== undefined && { botVisibility }),
      ...(rateLimit !== undefined && { rateLimit }),
      ...(rateLimitMessage !== undefined && { rateLimitMessage }),
      ...(rateLimitTime !== undefined && { rateLimitTime }),
      ...(allowIframe !== undefined && { allowIframe }),
    };
    const collection = db.collection("chatbot-settings");

    /// update the assistant configuration
    try {
      const assistant = await openai.beta.assistants.update(chatbotId, {
        instructions: updateFields.instruction,
        model: updateFields.model,
        /// do not set temparature if model is o1 or o3-mini
        ...(updateFields.model !== "o1" && updateFields.model !== "o3-mini"
          ? {
              temperature: updateFields.temperature,
              reasoning_effort: null,
            }
          : { temperature: null, reasoning_effort: "medium" }),
        // reasoning_effort: "medium",
        // temperature: updateFields.temperature,
      });
    } catch (error) {
      console.log("Error while updating assistant configuration", error);
    }
    /// update the name
    await collection.updateOne(
      {
        userId: userId,
        chatbotId: chatbotId,
      },
      { $set: updateFields }
    );
  }

  return { message: "Chatbot Updated successfully..." };
}

/**
 * defining schema for /chatbot/api/setting/api POST route
 */
retriveChatbotSettings.schema = joi.object({
  chatbotId: joi.string().required(),
});

/**
 * defining schema for /chatbot/api/setting/api PUT route
 */
updateChatbotSettings.schema = joi.object({
  chatbotId: joi.string().required(),
  chatbotRename: joi.string().optional(),
  model: joi.string().optional(),
  visibility: joi.string().optional(),
  temperature: joi.number().optional(),
  numberOfCharacterTrained: joi.string().optional(),
  instruction: joi.string().optional(),
  initialMessage: joi.array().optional(),
  suggestedMessages: joi.array().optional(),
  messagePlaceholder: joi.string().optional(),
  theme: joi.string().optional(),
  userMessageColor: joi.string().optional(),
  chatbotIconColor: joi.string().optional(),
  tempprofilePictureUrl: joi.string().optional().allow(""),
  tempbubbleIconUrl: joi.string().optional().allow(""),
  lastTrained: joi.date().optional(),
  chatbotBubbleAlignment: joi.string().optional().allow(""),
  tempprofilePictureName: joi.string().optional().allow(""),
  tempbubbleIconName: joi.string().optional().allow(""),
  chatbotDisplayName: joi.string().optional(),
  leadTitle: joi.string().optional(),
  userDetails: joi.string().optional(),
  leadFields: joi.object().optional(),
  botVisibility: joi.string().optional(),
  rateLimit: joi.number().optional(),
  rateLimitMessage: joi.string().optional(),
  rateLimitTime: joi.number().optional(),
  allowIframe: joi.boolean().optional(),
});
