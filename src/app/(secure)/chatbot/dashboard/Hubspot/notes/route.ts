import { createVectorStore } from "@/app/api/hubspot/_helpers/embed.data";
import { Result } from "antd";
require("dotenv").config();

//ANCHOR - Retrieving data of notes from Hub-spot and adding it to pinecone
export async function POST(request: Request) {
  const dataType = "Hubspot";
  const sourceType = "notes";
  const notes: null[] = [];
  let page = 1;
  let url =
    "https://api.hubspot.com/crm/v3/objects/notes?properties=hs_timestamp,hs_note_body,hubspot_owner_id,hs_note_subject,hs_note_status,hs_note_priority,hs_note_type&associations=contacts,deals,tasks";

  do {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}`,
      },
    });

    const result = await response.json();
    notes.push(...result.results);
    url = result.paging?.next?.link;// Get the next page token for pagination
    page++;
  } while (url);
  console.log(page)
//   return Response.json(notes)
  const contactsData = JSON.stringify(notes);// converting json data to string
  // const deleteData  =  await deletevectors(1 , 1, sourceType , dataType);

  const vectorStoreRes = await createVectorStore(
    contactsData,
    "a",
    "b",
    dataType,
    sourceType
  );

  return Response.json(notes);
}
// let allNotes: null[] = [];
//     let nextPage: string | null = null;
//     let a = 0
//     do {
//         console.log(nextPage)
//         const result:any = await hubspotClient.crm.objects.notes.basicApi.getPage( 25,
//             undefined,
//             ['hs_timestamp', 'hs_note_body', 'hubspot_owner_id', 'hs_attachment_ids'],
//             "46851988825",
//             ['contacts', 'deals', 'tasks', 'companies'],
//             false);

//             allNotes = allNotes.concat(result);

//             // Get the next page token for pagination
//             nextPage = result.paging?.next?.after;
//             a = a + 1
//             console.log(result.results.length)
//         }while(a < 1)

//         return Response.json(allNotes)

// const result = await hubspotClient.crm.objects.notes.basicApi.getPage( 5,
//     undefined,
//     ['hs_timestamp', 'hs_note_body', 'hubspot_owner_id', 'hs_attachment_ids'],
//     undefined,
//     ['contacts', 'deals', 'tasks', 'companies'],
//     false,);
//     return Response.json(result.paging)
