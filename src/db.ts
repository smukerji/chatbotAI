import { MongoClient } from "mongodb";

const uri: any = process.env.NEXT_PUBLIC_MONGO_URI;
const client = new MongoClient(uri);

async function connectDatabase() {
  await client.connect();
  return client.db();
}

export { connectDatabase };
