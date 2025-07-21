import clientPromise from "@/db";

export async function getUserTokens(assistantId: string) {
  const client = await clientPromise;
  const db = client.db();
  return db.collection("google_tokens").findOne({ assistantId });
}

export async function updateUserTokens(assistantId: string, tokens: any) {
  const client = await clientPromise;
  const db = client.db();
  await db.collection("google_tokens").updateOne(
    { assistantId },
    { $set: { ...tokens, assistantId } },
    { upsert: true }
  );
}