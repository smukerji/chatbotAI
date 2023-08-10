import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const options = {
    method: "GET",
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_AUTHORIZATION}`,
      cache: "no-store",
    },
    next: { revalidate: 0 },
  };

  try {
    /// fetch the chatbot data
    const response = await fetch(
      "https://www.chatbase.co/api/v1/get-chatbots",
      options
    );

    if (!response.ok) {
      throw new Error("Error while retriving chatbots");
    }

    const data = await response.json();
    console.log("Called", data);

    // console.log("Data...........", data);
    return NextResponse.json(data);
  } catch (error) {
    console.log("Error in chatbot route", error);
    return NextResponse.json({ error: "Error error" });
  }
}

export const fetchCache = "force-no-store";
export const revalidate = 0;
