import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { assistantId: string } }
) {
  try {
    const { assistantId } = params;

    if (!assistantId) {
      return NextResponse.json(
        { error: "Missing assistantId" },
        { status: 400 }
      );
    }

    console.log("Fetching system prompt for assistant:", assistantId);

    // Fetch assistant details from VAPI with cache-busting
    const vapiRes = await fetch(`https://api.vapi.ai/assistant/${assistantId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.VAPI_PRIVATE_KEY}`,
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
      },
 
      cache: "no-store",
      next: { revalidate: 0 }
    });

    if (!vapiRes.ok) {
      const errorData = await vapiRes.json();
      console.error("VAPI Error:", errorData);
      return NextResponse.json(
        { error: errorData.error || errorData.message || "Failed to fetch assistant from VAPI" },
        { status: vapiRes.status }
      );
    }

    const assistantData = await vapiRes.json();
    console.log("VAPI Assistant Data received");

    // Extract system prompt from assistant model configuration
    let systemPrompt = "";

    if (assistantData.model && assistantData.model.messages) {
      const systemMessage = assistantData.model.messages.find(
        (msg: any) => msg.role === "system"
      );
      
      if (systemMessage && systemMessage.content) {
        systemPrompt = systemMessage.content;
      }
    }

  
    return NextResponse.json(
      { 
        systemPrompt,
        assistantName: assistantData.name || "Unknown Assistant"
      },
      { 
        status: 200,
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
          "Pragma": "no-cache",
          "Expires": "0"
        }
      }
    );

  } catch (e: any) {
    console.error("Error fetching system prompt:", e);
    return NextResponse.json(
      { error: e.message || "Internal server error" },
      { status: 500 }
    );
  }
}