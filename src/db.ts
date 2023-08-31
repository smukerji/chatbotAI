import { MongoClient } from "mongodb";

const uri: any = process.env.NEXT_PUBLIC_MONGO_URI;
const client = new MongoClient(uri);

async function connectDatabase() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
  return client.db();
}

export { connectDatabase };
