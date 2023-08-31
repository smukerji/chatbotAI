import { NextResponse } from "next/server";
import { connectDatabase } from "../../../../db";

export async function POST(request: any) {
  const { chatbotId, userId } = await request.json();

  /// fetch the data sources of the chabot
  const db = await connectDatabase();
  const collection = db.collection("user-details");
  const cursor = await collection
    .find({ chatbotId: chatbotId, userId: userId })
    .toArray();

  /// filter the source as per home component
  let qaCount = 0;
  let qaCharCount = 0;
  let qaList: any = [];
  let text = "";
  let textLength = 0;
  let fileTextLength = 0;
  const defaultFileList: any = [];
  cursor.forEach((data) => {
    /// extract the QA object
    if (data.source == "qa") {
      qaCount += 1;
      qaCharCount += data.content.question.length + data.content.answer.length;
      qaList.push({
        question: data.content.question,
        answer: data.content.answer,
        id: data._id,
      });
    } else if (data.source == "text") {
      text += data.content;
      textLength += data.content.length;
    } else if (data.source == "file") {
      fileTextLength += data.contentLength;
      defaultFileList.push({
        name: data.fileName,
        charLength: data.contentLength,
        id: data._id,
      });
    }
  });

  return NextResponse.json({
    qaList,
    qaCount,
    qaCharCount,
    text,
    textLength,
    defaultFileList,
    fileTextLength,
  });
}
