import { Pinecone } from "@pinecone-database/pinecone";
import dotenv from "dotenv";
import { getPineconeApiKey, getPineconeIndexName } from "./hybrid-config";

dotenv.config();

let pineconeClient: Pinecone | null = null;

export function getPineconeClient(): Pinecone {
  if (!pineconeClient) {
    pineconeClient = new Pinecone({ apiKey: getPineconeApiKey() });
  }
  return pineconeClient;
}

export function getActivePineconeIndex() {
  return getPineconeClient().index(getPineconeIndexName());
}

export const upsert = async (vectors: any, userId: string) => {
  try {
    const index = getActivePineconeIndex();
    const upsertReq = await index.namespace(userId).upsert(vectors);
    return upsertReq;
  } catch (error) {
    console.error("Error during upsert:", error);
    return error;
  }
};

export const deletevectors = async (vectorIDs: [], namespace: string) => {
  try {
    const index = getActivePineconeIndex();
    const np = index.namespace(namespace);
    await np.deleteMany(vectorIDs);
  } catch (error) {
    console.error("Error initializing Pinecone client:", error);
    throw new Error("Failed to initialize Pinecone client while deleting");
  }
};

export const deleteFileVectorsById = async (userid: any, vectorIDs: any) => {
  try {
    const index = getActivePineconeIndex();
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
    const index = getActivePineconeIndex();
    console.log("Update data ", vectors);

    const upsertReq = await index.namespace(userId).upsert(vectors);
    console.log("Upsert request when updating", upsertReq);

    return upsertReq;
  } catch (error) {
    console.error("Error during update upsert:", error);
    return error;
  }
};
