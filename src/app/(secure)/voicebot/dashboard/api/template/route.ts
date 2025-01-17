import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "../../../../../_helpers/server/api/api-handler";
import clientPromise from "../../../../../../db";

module.exports = apiHandler({
  GET: getAssistantTemplate,
});

//  voicebot/dashboard/api/template
async function getAssistantTemplate(req: NextRequest) {
  try {
    const db = (await clientPromise!).db();
    const collection = db?.collection("voice-assistance-template");

    const assistantTemplates = await collection?.find({}).toArray();

    return { assistantTemplates };
  } catch (error: any) {
    return { error: error.message };
  }
}
