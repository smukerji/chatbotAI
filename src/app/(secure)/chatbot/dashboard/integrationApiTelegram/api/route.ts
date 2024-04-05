import { apiHandler } from "@/app/_helpers/server/api/api-handler";
import clientPromise from "@/db";
import { ObjectId } from "mongodb";

module.exports = apiHandler({
  GET: TelegramStatusCheck,
});

async function TelegramStatusCheck(request: any) {
  const params = await request.nextUrl.searchParams;
  const userId = params.get("userId");
  /// fetch the data sources of the Users
  const db = (await clientPromise!).db();
  const collection = db?.collection("user-details");

  const userCollection = db?.collection("users");
  try {
    const data = await collection.findOne({ userId });
    const userData = await userCollection.findOne({
      _id: new ObjectId(userId),
    });
    let isTelegram;
    if (data?.isTelegram == false) {
      if (userData?.status == undefined) {
        isTelegram = true;
      } else {
        isTelegram = false;
      }
    } else {
      isTelegram = data?.isTelegram ? data?.isTelegram : true;
    }
    return { isTelegramVerified: isTelegram };
  } catch (error) {
    return { error: "unable to get Telegram status" };
  }
}
