import { createVectorStore } from "@/app/api/hubspot/_helpers/embed.data";
import { Result } from "antd";
import axios from "axios";
const hubspot = require("@hubspot/api-client");
require("dotenv").config();

//ANCHOR - Retrieving data of tasks from Hub-spot and adding it to pinecone
export async function POST(request: Request) {
  const dataType = "Hubspot";
  const sourceType = "tasks";
  const tasks: null[] = [];
  let page = 1;
  let url =
    "https://api.hubspot.com/crm/v3/objects/tasks?properties=hs_timestamp,hs_task_body,hubspot_owner_id,hs_task_subject,hs_task_status,hs_task_priority,hs_task_type&associations=contacts,deals,notes";

  do {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}`,
      },
    });

    const result = await response.json();
    tasks.push(...result.results);
    url = result.paging?.next?.link; // Get the next page token for pagination
    page++;
  } while (url);
//   return Response.json(tasks)
  const contactsData = JSON.stringify(tasks);
  // const deleteData  =  await deletevectors(1 , 1, sourceType , dataType);

  const vectorStoreRes = await createVectorStore(
    contactsData,
    "a",
    "b",
    dataType,
    sourceType
  );

  return Response.json(tasks);
}

// let tasks: null[] = [];
//     let nextPage: string | null = null;
//     let a = 0
//     do {
//         console.log(nextPage)

//         const result:any = await hubspotClient.crm.objects.tasks.basicApi.getPage( 4,
//             undefined,
//             ['hs_timestamp', 'hs_note_body', 'hubspot_owner_id', 'hs_attachment_ids'],
//             "45867790516",
//             ['contacts', 'deals', 'tasks', 'companies'],
//             );

//             tasks = tasks.concat(result);

//             // Get the next page token for pagination
//             nextPage = result.paging?.next?.after;
//             a = a + 1
//             console.log(result.results.length)
//         }while(a < 2)

//         return Response.json(tasks)
// return Response.json(contacts)
