import { createVectorStore } from "@/app/api/hubspot/_helpers/embed.data";
import { deletevectors } from "@/app/api/hubspot/_helpers/pinecone";
import { Result } from "antd";
import { NextResponse } from "next/server";
require("dotenv").config();
const hubspot = require("@hubspot/api-client");

//ANCHOR - Retrieving data of activity from Hub-spot and adding it to pinecone
export async function POST(request: Request) {
  const dataType = "Hubspot";
  const sourceType = "activity";
  const activity: null[] = [];
  let page = 1;
  let url = "https://api.hubspot.com/account-info/v3/activity/security";

  do {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}`,
      },
    });

    let result = await response.json();
    activity.push(...result.results);
    url = result.paging?.next?.link;// Get the next page token for pagination
    page++;
  } while (url);
    // return Response.json(activity)
  const contactsData = JSON.stringify(activity);// converting json data to string
  // const deleteData  =  await deletevectors('b', 'a', sourceType , dataType);

  const vectorStoreRes = await createVectorStore(
    contactsData,
    "a",
    "b",
    dataType,
    sourceType
  );

  return NextResponse.json({ vectorStoreRes });
}

  // const hubspotClient = new hubspot.Client({  accessToken: process.env.HUBSPOT_ACCESS_TOKEN })
  // const result = await hubspotClient.crm.activities.basicApi.getPage({
  //     limit: 100
  // });
  //     return Response.json(result)
