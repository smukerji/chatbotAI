import { createVectorStore } from "@/app/api/hubspot/_helpers/embed.data";
import { deletevectors } from "@/app/api/hubspot/_helpers/pinecone";
import { Result } from "antd";
require("dotenv").config();
const hubspot = require("@hubspot/api-client");

//ANCHOR - Retrieving data of companies from Hub-spot and adding it to pinecone
export async function POST(request: Request) {
  const dataType = "Hubspot";
  const sourceType = "companies";
  const hubspotClient = new hubspot.Client({
    accessToken: process.env.HUBSPOT_ACCESS_TOKEN,
  });
  const result = await hubspotClient.crm.companies.getAll();
//   return Response.json(result)
  const contactsData = JSON.stringify(result);
//   const deleteData = await deletevectors("a", "a", sourceType, dataType);

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
