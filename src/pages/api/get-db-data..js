import userSchemaClientPromise from "../../userSchemaDb";
export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const body = JSON.parse(req.body);
      const collection = body?.collection;
      const filter = body?.filter;
      const projection = body?.projection;

      const db = (await userSchemaClientPromise).db();

      const dbCollection = db.collection(collection);

      const data = await dbCollection.find(filter, { projection }).toArray();

      return res.status(200).json(data);
    } catch (error) {
      console.error("Error fetching data from MongoDB:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  } else {
    return res.status(405).json({ message: "Method not allowed" });
  }
}
