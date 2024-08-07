import { Pinecone } from "@pinecone-database/pinecone";
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

export const upsert = async (vectors: any, userId: string) => {
  try {
    const pinecone = new Pinecone({
      apiKey: process.env.NEXT_PUBLIC_PINECONE_KEY!,
    });

    try {
      const index = pinecone.index(process.env.NEXT_PUBLIC_PINECONE_INDEX!);
      const upsertReq = await index.namespace(userId).upsert(vectors);
      return upsertReq;
    } catch (error) {
      console.error("Error during upsert:", error);
      return error;
    }
  } catch (error) {
    console.error("Error initializing Pinecone client:", error);
    throw new Error("Failed to initialize Pinecone client while upserting");
  }
};

export const deletevectors = async (vectorIDs: [], namespace: string) => {
  try {
    const pinecone = new Pinecone({
      apiKey: process.env.NEXT_PUBLIC_PINECONE_KEY!,
    });
    const index = pinecone.index(process.env.NEXT_PUBLIC_PINECONE_INDEX!);
    const np = index.namespace(namespace);
    await np.deleteMany(
      vectorIDs
      // deleteAll: false,
      // namespace: namespace,
    );
  } catch (error) {
    console.error("Error initializing Pinecone client:", error);
    throw new Error("Failed to initialize Pinecone client while deleting");
  }
};

export const deleteFileVectorsById = async (userid: any, vectorIDs: any) => {
  try {
    const pinecone = new Pinecone({
      apiKey: process.env.NEXT_PUBLIC_PINECONE_KEY!,
    });
    const index = pinecone.index(process.env.NEXT_PUBLIC_PINECONE_INDEX!);
    const np = index.namespace(userid);

    const deleteVec = await np.deleteMany(vectorIDs);
    console.log("delete file vectors", vectorIDs);
    return deleteVec;
  } catch (error) {
    console.error("Error initializing Pinecone client:", error);
    throw new Error(
      "Failed to initialize Pinecone client while deleting vectors by id"
    );
  }
};

export const updateVectorsById = async (vectors: any, userId: any) => {
  try {
    const pinecone = new Pinecone({
      apiKey: process.env.NEXT_PUBLIC_PINECONE_KEY!,
    });
    const index = pinecone.index(process.env.NEXT_PUBLIC_PINECONE_INDEX!);
    try {
      console.log("Update data ", vectors);

      const upsertReq = await index.namespace(userId).upsert(vectors);
      console.log("Upsert request when updating", upsertReq);

      return upsertReq;
    } catch (error) {
      console.error("Error during update upsert:", error);
      return error;
    }
  } catch (error) {
    console.error("Error initializing Pinecone client:", error);
    throw new Error(
      "Failed to initialize Pinecone client while updating vectors by id"
    );
  }
};
