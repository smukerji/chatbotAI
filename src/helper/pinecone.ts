import { PineconeClient } from "@pinecone-database/pinecone";
// import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { v4 as uuid } from "uuid";
import { createEmbedding } from "./embeddings";
import { connectDatabase } from "../db";
// import { encode } from 'gpt-3-encoder';
// import {
//   PINECONE_API_KEY,
//   PINECONE_ENV,
//   PINECONE_INDEX,
// } from 'src/common/utilities/config.utility';
// import { createEmbedding } from './openAI';
const CHUNK_LIMIT = 200;
const CHUNK_MINIMAL = 100;
// import { PineconeClient } from '@pinecone-database/pinecone';

export const pinecone = new PineconeClient();
try {
  pinecone.init({
    environment: process.env.NEXT_PUBLIC_PINECONE_ENV as string,
    apiKey: process.env.NEXT_PUBLIC_PINECONE_KEY as string,
  });
} catch (error) {
  console.error("Error initializing Pinecone client:", error);
  throw new Error("Failed to initialize Pinecone client");
}

export const upsert = async (vectors: any, userId: string) => {
  const index = pinecone.Index(
    process.env.NEXT_PUBLIC_PINECONE_INDEX as string
  );

  try {
    const upsertReq = await index.upsert({
      upsertRequest: {
        vectors,
        namespace: userId,
      },
    });
    return upsertReq;
  } catch (error) {
    console.error("Error during upsert:", error);
    return error;
  }
};

export const deletevectors = async (vectorIDs: [], namespace: string) => {
  const index = pinecone.Index(
    process.env.NEXT_PUBLIC_PINECONE_INDEX as string
  );

  await index.delete1({
    ids: vectorIDs,
    deleteAll: false,
    namespace: namespace,
  });
};

// export const deleteFileVectorsByMetadata = async (
//   userid,
//   fileid,
//   chatbotid,
//   filename
// ) => {
//   const index = pinecone.Index(PINECONE_INDEX);
//   //  await index.delete1({
//   //   deleteAll:true,
//   //   namespace:'713bb86b-2c3f-412f-a110-a20bd32abe55'
//   // })
//   const deleteVec = await index._delete({
//     deleteRequest: {
//       namespace: userid,
//       filter: {
//         file_name: filename,
//         chatbot_id: chatbotid,
//       },
//     },
//   });
//   return deleteVec;
// };

// export const deleteRawVectorsByMetadata = async (userid, chatbotid) => {
//   const index = pinecone.Index(PINECONE_INDEX);
//   //  await index.delete1({
//   //   deleteAll:true,
//   //   namespace:'713bb86b-2c3f-412f-a110-a20bd32abe55'
//   // })
//   const deleteVec = await index._delete({
//     deleteRequest: {
//       namespace: userid,
//       filter: {
//         source_type: { $in: ["QnA", "text"] },
//         chatbot_id: chatbotid,
//       },
//     },
//   });
//   return deleteVec;
// };

// export const deleteChatbotData = async (chatbotid, userid) => {
//   const index = pinecone.Index(PINECONE_INDEX);

//   const deleteVec = await index._delete({
//     deleteRequest: {
//       namespace: userid,
//       filter: {
//         source_type: { $in: ["QnA", "text", "file"] },
//         chatbot_id: chatbotid,
//       },
//     },
//   });
//   return deleteVec;
// };
