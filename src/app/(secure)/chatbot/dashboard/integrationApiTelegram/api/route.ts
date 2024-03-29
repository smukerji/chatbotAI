import { apiHandler } from "@/app/_helpers/server/api/api-handler";
import clientPromise from "@/db";
import { ObjectId } from "mongodb";

module.exports = apiHandler({
  GET: TelegramStatusCheck,
});

async function TelegramStatusCheck(request: any) {
  const params = await request.nextUrl.searchParams;
  const userId = params.get("userId");
  console.log(userId);
  /// fetch the data sources of the Users
  const db = (await clientPromise!).db();
  const collection = db?.collection("user-details");
  try {
    const data = await collection.findOne({ userId});
    let isTelegram 
    if(data?.isTelegram == null){
        isTelegram = false
    }
    else{
        isTelegram = data?.isTelegram
    }
    return { isTelegramVerified: isTelegram };
  } catch (error) {
    return { error: "unable to get Telegram status" };
  }
}
