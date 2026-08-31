import { MongoClient } from "mongodb";

const uri = process.env.NEXT_PUBLIC_MONGO_URI;

if (!uri) {
  throw new Error("Please add your mongodb URI to .env.local");
}

const options = {
  // A pool of 1 meant every concurrent request queued behind a single
  // connection, and a 10s idle timeout kept tearing it down and rebuilding it.
  // NextAuth's session lookup then failed with MongoServerSelectionError after
  // 10000ms while a direct connection to the same cluster took 1.6s.
  //
  // Kept small rather than raised to a typical server value: this deploys to
  // serverless, where every instance holds its own client and Atlas caps total
  // connections. Five is enough to stop self-inflicted queueing without
  // multiplying the cluster's connection count.
  maxPoolSize: 5,
  minPoolSize: 0,
  // was 10000 - long enough that a connection is reused between requests
  // instead of being re-established on each one
  maxIdleTimeMS: 60000,
  // was 10000. Discovery to this cluster measured 1.6s on a good link, but the
  // same machine took 11.6s to reach Google's OAuth endpoint, so the ceiling
  // has to allow for a slow network rather than assume a fast one.
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
};

let client;
let clientPromise;

// async function connectDatabase() {
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
export default clientPromise;
// }

// export clientPromise ;
