import { apiHandler } from "../../../../_helpers/server/api/api-handler";
import clientPromise from "@/db";
import { NextApiRequest } from "next";

module.exports = apiHandler({
  GET: getAssistantTemplate,
});

async function getAssistantTemplate(
  req: NextApiRequest,
  { params: { type } }: any
) {
  /// get the params from the request

  try {
    const db = (await clientPromise!).db();

    if (type === "assistant-types") {
      const collection = db?.collection("assistant-types");

      const assistantTypes = await collection?.find({}).toArray();

      return { assistantTypes };
    } else {
      const collection = db?.collection("industry-types");

      const industryTypes = await collection?.find({}).toArray();

      return { industryTypes };
    }
  } catch (error: any) {
    return { error: error.message };
  }
}
