import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function GET(request: NextRequest) {
  /// extracting the configuration for chatbot creation
  // const { chatbotName, source, sourceUrl } = config;
  let source = request.nextUrl.searchParams.get("source");
  const sourceUrl = request.nextUrl.searchParams.get("sourceURL");

  if (sourceUrl == "")
    return NextResponse.json({ error: "Url cannot be empty" });

  //   return NextResponse.json();
  if (source == "doc") {
  } else if (source == "website") {
    /// crawl the urls
    const url = "https://www.chatbase.co/api/v1/fetch-links";

    try {
      const headers = {
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_AUTHORIZATION}`,
      };

      const burl = url + "?sourceURL=" + sourceUrl;
      //   const response = await fetch(burl, options);
      const response = await axios.get(burl, { headers });
      console.log("Fecthing link data", response.data);
      return NextResponse.json(response.data);
    } catch (error: any) {
      return NextResponse.json("Error:", error.message);
    }
    // return NextResponse.json("fds");
  }
}
