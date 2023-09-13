import { MongoClient } from "mongodb";

const uri: any = process.env.NEXT_PUBLIC_MONGO_URI;

if (!uri) {
  throw new Error("Please add your mongodb URI to .env.local");
}

let client: any;

async function connectDatabase() {
  if (client) {
    return client.db();
  }
  try {
    client = new MongoClient(uri);
    await client.connect();
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
  return client.db();
}

export { connectDatabase };
