import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "../../../../../db";
import { apiHandler } from "../../../../_helpers/server/api/api-handler";
import joi from "joi";

module.exports = apiHandler({
  POST: dataSources,
  GET: getChatBotSettings,
});

async function dataSources(request: any) {
  const { chatbotId, userId } = await request.json();

  /// fetch the data sources of the chabot
  const db = (await connectDatabase())?.db();
  const collection = db?.collection("chatbots-data");
  const cursor = await collection?.find({ chatbotId: chatbotId }).toArray();

  /// get the chatbot name from ID (needed if user has updated the chatbot name)
  const chatbotCollection = db?.collection("user-chatbots");
  const chatbotDetails = await chatbotCollection?.findOne({
    chatbotId: chatbotId,
  });

  /// get chatbot Setting
  const chatBotSettingCollection = db.collection("chatbot-settings");
  const chatbotSetting = await chatBotSettingCollection.findOne({
    chatbotId: chatbotId,
    userId: userId,
  });

  /// filter the source as per home component
  let qaCount = 0;
  let qaCharCount = 0;
  let qaList: any = [];
  let text = "";
  let textLength = 0;
  let fileTextLength = 0;
  let crawlDataLength = 0;
  let crawlData: any = [];
  const defaultFileList: any = [];
  cursor.forEach((data: any) => {
    /// extract the QA object
    if (data.source == "qa") {
      /// get the qa data if embedded previosuly
      qaCount += 1;
      qaCharCount += data.content.question.length + data.content.answer.length;
      qaList.push({
        question: data.content.question,
        answer: data.content.answer,
        image: data.content.filename,
        id: data._id,
      });
    } else if (data.source == "text") {
      /// get the text data if embedded previosuly
      text += data.content;
      textLength += data.content.length;
    } else if (data.source == "file") {
      /// get the file data if embedded previosuly
      fileTextLength += data.contentLength;
      defaultFileList.push({
        name: data.fileName,
        charLength: data.contentLength,
        id: data._id,
      });
    } else if (data.source == "crawling") {
      /// get the crawling data if embedded previosuly
      data.content.forEach((data: any) => {
        crawlDataLength += parseInt(data.charCount);
      });
      crawlData.push(data.content);
    }
  });

  return {
    qaList,
    qaCount,
    qaCharCount,
    text,
    textLength,
    defaultFileList,
    fileTextLength,
    crawlData,
    crawlDataLength,
    chatbotName: chatbotDetails?.chatbotName,
    chatbotSetting,
  };
}

async function getChatBotSettings(request: NextRequest) {
  const params = await request.nextUrl.searchParams;
  const chatbotId = params.get("chatbotId");
  const userId = params.get("userId");

  /// get chatbot Setting
  const db = (await connectDatabase())?.db();
  const chatBotSettingCollection = db.collection("chatbot-settings");
  const chatbotSetting = await chatBotSettingCollection.findOne({
    chatbotId: chatbotId,
    userId: userId,
  });

  return { chatbotSetting };
}

getChatBotSettings.schema = joi.object({
  chatbotId: joi.string().required(),
  userId: joi.string().required(),
  // email: joi.string().required(),
});
