import { createVectorStore } from "@/app/api/hubspot/_helpers/embed.data";
import { Result } from "antd";
require("dotenv").config();
const hubspot = require("@hubspot/api-client");

//ANCHOR - Retrieving data of deals from Hub-spot and adding it to pinecone
export async function POST(request: Request) {
  const dataType = "Hubspot";
  const sourceType = "deals";
  const hubspotClient = new hubspot.Client({
    accessToken: process.env.HUBSPOT_ACCESS_TOKEN,
  });
  const result = await hubspotClient.crm.deals.getAll();
//   return Response.json(result)
  const contactsData = JSON.stringify(result);

  // const deleteData  =  await deletevectors(1 , 1, sourceType , dataType);

  //ANCHOR - data embedding and storing it to the pinecone
  const vectorStoreRes = await createVectorStore(
    contactsData,
    "a",
    "b",
    dataType,
    sourceType
  );

  return Response.json(result);
}
