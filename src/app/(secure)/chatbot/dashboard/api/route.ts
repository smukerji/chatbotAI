import { NextResponse } from "next/server";
import { connectDatabase } from "../../../../../db";
import { apiHandler } from "../../../../_helpers/server/api/api-handler";

module.exports = apiHandler({
  POST: dataSources,
});

async function dataSources(request: any) {
  const { chatbotId, userId } = await request.json();

  /// fetch the data sources of the chabot
  const db = (await connectDatabase())?.db();
  const collection = db?.collection("chatbots-data");
  const cursor = await collection?.find({ chatbotId: chatbotId }).toArray();

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
        image: data.content.image,
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
  };
}
