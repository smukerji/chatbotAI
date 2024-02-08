import { createVectorStoreQuery } from "@/app/api/hubspot/_helpers/embed.data";
import { createResponse } from "@/app/api/hubspot/_helpers/openAI";

export async function POST(request: Request) {
  let question = "give me contact details of shivam";

  //ANCHOR - querying from pinecone
  const ans = await createVectorStoreQuery(
    question,
    "a",
    "b",
    "dataType",
    "sourceType"
  );
  const data: any = ans.matches;
  const allMetadata: any = data.map((item: any) => item.metadata);
  const combinedString = allMetadata
    .map((obj: any) => JSON.stringify(obj))
    .join("");
  console.log(combinedString);
  
  //ANCHOR - asking question to openAI
  const res = await createResponse(question, combinedString);

  return Response.json(res);
}
