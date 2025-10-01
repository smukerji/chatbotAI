import { NextRequest } from "next/server";
import { apiHandler } from "../../../../_helpers/server/api/api-handler";
import clientPromise from "../../../../../db";
import joi from "joi";

async function getTextSource(req: NextRequest) {
  const body = await req.json();
  const chatbotId = body?.chatbotId;

  if (!chatbotId) {
    return new Response(JSON.stringify({ error: "chatbotId required" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const db = (await clientPromise!).db();

  const coll = db.collection("chatbots-data");
  const docs: any[] = await coll
    .find({ chatbotId: chatbotId, source: "text" })
    .toArray();

  // Use only the first matching text source (no concatenation)
  const doc = docs && docs.length > 0 ? docs[0] : null;
  let text = "";
  if (doc) {
    if (typeof doc.content === "string" && doc.content.trim())
      text = doc.content.trim();
    else if (typeof doc.text === "string" && doc.text.trim())
      text = doc.text.trim();
    else if (Array.isArray(doc.items))
      text = doc.items.filter(Boolean).join("\n\n");
  }

  return { text };
}

getTextSource.schema = joi.object({ chatbotId: joi.string().required() });

module.exports = apiHandler({ POST: getTextSource });
