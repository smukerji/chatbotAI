import { openai } from "@/app/openai";
import clientPromise from "@/db";

export const runtime = "nodejs";

// Send a new message to a thread
export async function POST(request: any, { params: { threadId } }: any) {
  const { content, assistantId } = await request.json();

  /// get the schema_info if any from chatbots-data
  const db = (await clientPromise!).db();
  const collection = db.collection("chatbots-data");
  /// all the data sources of this assistant id and it contains schema_info object
  const assistantData = await collection
    .find({
      chatbotId: assistantId,
    })
    .toArray();

  /// extract all the schema_info who are not undefined from the assistantData
  const schemaInfo = assistantData
    .map((data: any) => data.schema_info)
    .filter((info: any) => info !== undefined);

  console.log("Schema Info:", schemaInfo);

  let userQuery = `userQuery: ${content} \n\n schema_info: ${JSON.stringify(
    schemaInfo
  )} `;
  await openai.beta.threads.messages.create(threadId, {
    role: "user",
    content: userQuery,
  });

  const stream = openai.beta.threads.runs.stream(threadId, {
    assistant_id: assistantId,
    // instructions: "You are a helpful assistant.",
  });

  return new Response(stream.toReadableStream());
}

export const maxDuration = 300;
