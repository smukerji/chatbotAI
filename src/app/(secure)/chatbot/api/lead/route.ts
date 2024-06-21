import { apiHandler } from "@/app/_helpers/server/api/api-handler";
import clientPromise from "@/db";
import joi from "joi";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { start } from "repl";

// async function submitLeadDetail(request: NextRequest) {
//   // Extract necessary data from request body
//   const body = await request.json();

//   const { chatbotId, userId, leadDetails, sessionId, id }: any = body;

//   try {
//     const db = (await clientPromise!).db();
//     const leadsCollection = db.collection("leads");

//     /// check if the lead details is already saved
//     try {
//       const filter = {
//         chatbotId,
//         userId,
//         email: leadDetails.email,
//       };

//       /// check if the lead details is already saved
//       const sessions = await leadsCollection.findOne(filter);

//       if (!sessions) {
//         /// insert the lead details

//         await leadsCollection.insertOne({
//           timestamp: new Date(),
//           chatbotId,
//           userId,
//           email: leadDetails.email,
//           leadDetails,
//           sessions: {
//             [id]: [sessionId],
//           },
//         });
//       } else {
//         /// update the lead details
//         await leadsCollection.updateOne(filter, {
//           $addToSet: {
//             [`sessions.${id}`]: sessionId,
//           },
//         });
//       }

//       return { message: "Lead details saved successfully." };
//     } catch (error) {
//       console.error("Error while updating lead:", error);
//       return { message: "Error while updating lead" };
//     }

//     // Insert lead details into the leads collection
//   } catch (error) {
//     console.error("Error saving lead details:", error);
//     throw new Error("An error occurred while saving lead details.");
//   }
// }

async function submitLeadDetail(request: NextRequest) {
  try {
    const body = await request.json();
    // Extract necessary data from request body
    const { chatbotId, userId, leadDetails, sessionId, id } = body;
    const db = (await clientPromise!).db();
    const leadsCollection = db.collection("leads");

    // Check if the lead details is already saved
    const filter = {
      chatbotId,
      userId,
      "leadDetails.email": leadDetails.email,
    };
    // Check if the lead details is already saved
    const update = {
      $setOnInsert: {
        timestamp: new Date(),
        chatbotId,
        userId,
        leadDetails,
      },
      $addToSet: { [`sessions.${id}`]: sessionId },
    };
    const options = { upsert: true };

    await leadsCollection.updateOne(filter, update, options);

    return { message: "Lead details saved successfully." };
  } catch (error) {
    console.error("Error handling lead details:", error);
    throw new Error("An error occurred while handling lead details.");
  }
}

/// function to get leads
async function getLeads(request: NextRequest) {
  const count = request.nextUrl.searchParams.get("count")! || 0;

  /// check if the api is used to count the leads or to get the leads
  const db = (await clientPromise!).db();
  const leadsCollection = db.collection("leads");
  const chatbotId = request.nextUrl.searchParams.get("chatbotId");
  const startDate = request.nextUrl.searchParams.get("startDate");
  const endDate = request.nextUrl.searchParams.get("endDate");
  let timestamp: any = null;
  let leadsCursor = null;
  let leadsCount = null;

  if (startDate != "null" && endDate != "null") {
    timestamp = {
      $gte: new Date(startDate!), // Start date
      $lte: new Date(endDate + "T23:59:59"), // End date
    };
  }

  /// function to retrive leads
  async function retriveLeads() {
    const page = parseInt(request.nextUrl.searchParams.get("page")!) || 1;
    const pageSize =
      parseInt(request.nextUrl.searchParams.get("pageSize")!) || 10;

    /// timestamp is used to get the leads between the start and end date
    if (timestamp) {
      leadsCursor = await leadsCollection
        .find({
          chatbotId: chatbotId,
          timestamp,
        })
        .project({
          chatbotId: 0,
          userId: 0,
        })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .toArray();
    } else {
      leadsCursor = await leadsCollection
        .find({
          chatbotId: chatbotId,
        })
        .project({
          chatbotId: 0,
          userId: 0,
        })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .toArray();
    }

    // Flatten leadDetails
    const flattenedLeads = leadsCursor.map((lead: any) => ({
      _id: lead._id,
      name:
        lead.leadDetails.name !== "" && lead.leadDetails.name
          ? lead.leadDetails.name
          : "N/A",
      email:
        lead.leadDetails.email !== "" && lead.leadDetails.email
          ? lead.leadDetails.email
          : "N/A",
      number:
        lead.leadDetails.number !== "" && lead.leadDetails.number
          ? lead.leadDetails.number
          : "N/A",
      date: new Date(lead.timestamp).toLocaleDateString("en-GB"),
      sessions: lead.sessions ? lead.sessions : "N/A",
    }));

    return flattenedLeads;
  }

  if (count === "true") {
    if (timestamp) {
      leadsCount = await leadsCollection.countDocuments({
        chatbotId: chatbotId,
        timestamp,
      });
    } else {
      leadsCount = await leadsCollection.countDocuments({
        chatbotId: chatbotId,
      });
    }

    return { leadsCount, leads: await retriveLeads() };
  } else {
    return { leads: await retriveLeads() };
  }
}

submitLeadDetail.schema = joi.object({
  chatbotId: joi.string().required(),
  userId: joi.string().optional(), // userId is optional since you handle it in the function
  leadDetails: joi.object().required(),
  sessionId: joi.string().required(), // Adjust the schema according to your leadDetails structure
  id: joi.string().required().not(""),
});

module.exports = apiHandler({
  POST: submitLeadDetail,
  GET: getLeads,
});
