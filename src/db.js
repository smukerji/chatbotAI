import { MongoClient } from "mongodb";

const uri = process.env.NEXT_PUBLIC_MONGO_URI;

if (!uri) {
  throw new Error("Please add your mongodb URI to .env.local");
}

const options = {
  maxIdleTimeMS: 10000,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 20000,
  maxPoolSize: 10,
};

let client;
let clientPromise;

async function connectDatabase() {
  if (process.env.NODE_ENV === "development") {
    // In development mode, use a global variable so that the value
    // is preserved across module reloads caused by HMR (Hot Module Replacement).
    if (!global._mongoClientPromise) {
      client = new MongoClient(uri, options);
      global._mongoClientPromise = client.connect();
      console.log("Connected to MongoDB in ", process.env.NODE_ENV, " mode");
    }
    clientPromise = global._mongoClientPromise;
  } else {
    // In production mode, it's best to not use a global variable.
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
    console.log("Connected to MongoDB in ", process.env.NODE_ENV, " mode");
  }
  // if (client) {
  //   return clientPromise;
  // }
  // try {
  //   client = new MongoClient(uri);
  //   clientPromise = await client.connect();
  //   console.log("Connected to MongoDB", process.env.NODE_ENV);
  // } catch (error) {
  //   console.error("Error connecting to MongoDB:", error);
  // }
  return clientPromise;
}

export { connectDatabase };
