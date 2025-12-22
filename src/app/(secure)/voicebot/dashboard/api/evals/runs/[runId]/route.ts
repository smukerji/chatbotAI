import { NextRequest } from "next/server";
import { apiHandler } from "@/app/_helpers/server/api/api-handler";

module.exports = apiHandler({
  GET: getEvalRun,
});

async function getEvalRun(req: NextRequest) {
  try {
    const runId = req.nextUrl.pathname.split("/").pop(); 
    if (!runId) return { error: "Missing runId", status: 400 };

    const vapiRes = await fetch(`https://api.vapi.ai/eval/run/${runId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.VAPI_PRIVATE_KEY}`,
      },
    });

    const vapiData = await vapiRes.json();

    if (!vapiRes.ok) {
      return {
        error: vapiData.error || vapiData.message || "Failed to get eval run",
        status: vapiRes.status,
      };
    }
    return { run: vapiData, status: 200 };
  } catch (e: any) {
    return { error: e.message || "Internal server error", status: 500 };
  }
}
