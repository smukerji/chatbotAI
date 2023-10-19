import { PineconeClient } from "@pinecone-database/pinecone";
// import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { v4 as uuid } from "uuid";
import { createEmbedding } from "./embeddings";
import dotenv from "dotenv";
dotenv.config();
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

export const upsert = async (vectors: any, userId: string) => {
  try {
    console.log("FDSFDSFDSFSD fj sdfhgjh", userId);

    await pinecone
      .init({
        environment: process.env.NEXT_PUBLIC_PINECONE_ENV as string,
        apiKey: process.env.NEXT_PUBLIC_PINECONE_KEY as string,
      })
      .then(async () => {
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
      });
  } catch (error) {
    console.error("Error initializing Pinecone client:", error);
    throw new Error("Failed to initialize Pinecone client");
  }
};

export const deletevectors = async (vectorIDs: [], namespace: string) => {
  try {
    await pinecone
      .init({
        environment: process.env.NEXT_PUBLIC_PINECONE_ENV as string,
        apiKey: process.env.NEXT_PUBLIC_PINECONE_KEY as string,
      })
      .then(async () => {
        const index = pinecone.Index(
          process.env.NEXT_PUBLIC_PINECONE_INDEX as string
        );

        await index.delete1({
          ids: vectorIDs,
          deleteAll: false,
          namespace: namespace,
        });
      });
  } catch (error) {
    console.error("Error initializing Pinecone client:", error);
    throw new Error("Failed to initialize Pinecone client");
  }
};

export const deleteFileVectorsById = async (userid: any, vectorIDs: any) => {
  try {
    await pinecone.init({
      environment: process.env.NEXT_PUBLIC_PINECONE_ENV!,
      apiKey: process.env.NEXT_PUBLIC_PINECONE_KEY!,
    });
  } catch (error) {
    console.error("Error initializing Pinecone client:", error);
    throw new Error("Failed to initialize Pinecone client");
  }
  const index = pinecone.Index(process.env.NEXT_PUBLIC_PINECONE_INDEX!);
  // await pinecone.init({
  //   environment: process.env.NEXT_PUBLIC_PINECONE_ENV as string,
  //   apiKey: process.env.NEXT_PUBLIC_PINECONE_KEY as string,
  // });
  // const index = pinecone.Index(
  //   process.env.NEXT_PUBLIC_PINECONE_INDEX as string
  // );
  // const tr = await index.delete1({
  //   deleteAll: true,
  //   namespace: "cf588580-b69f-4894-b87e-0f0b723d8e81",
  // });

  //  await index.delete1({
  //   deleteAll:true,
  //   namespace:'713bb86b-2c3f-412f-a110-a20bd32abe55'
  // })
  // console.log(filename, chatbotid, userid);

  const deleteVec = await index.delete1({
    ids: vectorIDs,
    deleteAll: false,
    namespace: userid,
  });
  console.log(vectorIDs, deleteVec);
  return deleteVec;
};

export const updateVectorsById = async (vectors: any, userId: any) => {
  try {
    await pinecone.init({
      environment: process.env.NEXT_PUBLIC_PINECONE_ENV as string,
      apiKey: process.env.NEXT_PUBLIC_PINECONE_KEY as string,
    });
  } catch (error) {
    console.error("Error initializing Pinecone client:", error);
    throw new Error("Failed to initialize Pinecone client");
  }

  const index = pinecone.Index(
    process.env.NEXT_PUBLIC_PINECONE_INDEX as string
  );

  try {
    console.log("Update data ", vectors);

    const upsertReq = await index.upsert({
      upsertRequest: {
        vectors,
        namespace: userId,
      },
    });
    console.log("Upsert request when updating", upsertReq);

    return upsertReq;
  } catch (error) {
    console.error("Error during update upsert:", error);
    return error;
  }
};

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
