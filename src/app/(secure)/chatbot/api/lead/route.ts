import { apiHandler } from "@/app/_helpers/server/api/api-handler";
import clientPromise from "@/db";
import joi from "joi";
import { NextRequest, NextResponse } from "next/server";

async function submitLeadDetail(request: NextRequest) {
  // Extract necessary data from request body
  const body = await request.json();

  const { chatbotId, userId, leadDetails, sessionId }: any = body;

  try {
    const db = (await clientPromise!).db();
    const leadsCollection = db.collection("leads");

    // Insert lead details into the leads collection
    await leadsCollection.insertOne({
      chatbotId,
      userId,
      leadDetails,
      timestamp: new Date(),
      sessionId,
    });

    return { message: "Lead details saved successfully." };
  } catch (error) {
    console.error("Error saving lead details:", error);
    throw new Error("An error occurred while saving lead details.");
  }
}

/// function to get leads
async function getLeads(request: NextRequest) {
  const page = parseInt(request.nextUrl.searchParams.get("page")!) || 1;
  const pageSize =
    parseInt(request.nextUrl.searchParams.get("pageSize")!) || 100;
  const chatbotId = request.nextUrl.searchParams.get("chatbotId");

  const db = (await clientPromise!).db();
  const leadsCollection = db.collection("leads");

  console.log(new Date("2024-06-11").toISOString());

  const leadsCursor = await leadsCollection
    .find({
      chatbotId: chatbotId,
      timestamp: {
        $gte: new Date("2024-06-10"), // Start date
        $lte: new Date("2024-06-11T23:59:59"), // End date
      },
    })
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .toArray();

  return { leads: leadsCursor };
}

submitLeadDetail.schema = joi.object({
  chatbotId: joi.string().required(),
  userId: joi.string().optional(), // userId is optional since you handle it in the function
  leadDetails: joi.object().required(),
  sessionId: joi.string().required(), // Adjust the schema according to your leadDetails structure
});

module.exports = apiHandler({
  POST: submitLeadDetail,
  GET: getLeads,
});
