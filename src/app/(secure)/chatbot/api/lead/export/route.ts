import { apiHandler } from "@/app/_helpers/server/api/api-handler";
import clientPromise from "@/db";
import { NextRequest } from "next/server";

async function exportLeads(request: NextRequest) {
  const db = (await clientPromise!).db();
  const leadsCollection = db.collection("leads");
  const chatbotId = request.nextUrl.searchParams.get("chatbotId");

  const leadsExport = await leadsCollection
    .find({
      chatbotId: chatbotId,
    })
    .project({
      chatbotId: 0,
      userId: 0,
    })
    .toArray();

  // Flatten leadDetails
  const flattenedLeads = leadsExport?.map((lead: any) => ({
    Date: new Date(lead.timestamp).toLocaleDateString("en-GB"),
    Name: lead.leadDetails.name !== "" ? lead.leadDetails.name : "N/A",
    Email: lead.leadDetails.email !== "" ? lead.leadDetails.email : "N/A",
    Number: lead.leadDetails.number !== "" ? lead.leadDetails.number : "N/A",
  }));

  return flattenedLeads;
}

module.exports = apiHandler({
  GET: exportLeads,
});
