import { apiHandler } from "@/app/_helpers/server/api/api-handler";
import clientPromise from "@/db";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

async function getVoicebotUsageDetail(req: any, res: NextResponse) {
  try {
    const db = (await clientPromise!)?.db();
    let { u_id } = await req.json();
    const collectionUser = db.collection("users");
    const collectionDetails = db.collection("user-details");
    const userData = await collectionUser.findOne({
      _id: new ObjectId(u_id),
    });

    const details = await collectionDetails.findOne({
      userId: String(userData._id),
    });

    if (!details) {
      return { msg: "Addon details not found." };
    }

    const voicebotPlanId = userData.voicebotPlanId;

    if (!voicebotPlanId) {
      return { msg: "Voicebot Plan not found", status: 0 };
    }

    const voiebotWalletCredit = details.voicebotDetails;

    return {
      msg: "Voicebot Usage Details",
      walletCredit: voiebotWalletCredit,
    };
  } catch (error) {
    return { msg: "finding error", status: 0 };
  }
}

module.exports = apiHandler({
  POST: getVoicebotUsageDetail,
});
