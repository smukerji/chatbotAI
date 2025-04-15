import { MongoClient } from "mongodb";

const uri = process.env.NEXT_PUBLIC_MONGO_USER_SCHEMA_URI;

if (!uri) {
  throw new Error("Please add your mongodb URI to .env.local");
}

const options = {
  maxIdleTimeMS: 10000,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 20000,
  maxPoolSize: 1,
  minPoolSize: 1,
};

let client;
let clientPromise;

// async function connectDatabase() {
if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  if (!global._mongoUserSchemaClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoUserSchemaClientPromise = client.connect();
    console.log(
      "Connected to MongoDB user schema in ",
      process.env.NODE_ENV,
      " mode"
    );
  }
  clientPromise = global._mongoUserSchemaClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
  console.log(
    "Connected to MongoDB user schema  in ",
    process.env.NODE_ENV,
    " mode"
  );
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
