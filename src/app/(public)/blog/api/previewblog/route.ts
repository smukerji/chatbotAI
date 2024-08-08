import { apiHandler } from "../../../../_helpers/server/api/api-handler";
import { message } from "antd";
import axios from "axios";
import { NextRequest } from "next/server";

// Function to get single blog from contentful api

async function getpreviewBlog(request: NextRequest) {
  console.log("coming in request");

  const entryId = request.nextUrl.searchParams.get("slug") || "";

  let response;

  console.log(">>>", entryId);

  await axios
    .get(
      `https://preview.contentful.com/spaces/${process.env.NEXT_PUBLIC_CONTENTFUL_SPACE_ID}/environments/master/entries/${entryId}`,

      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_CONTENTFUL_PREVIEW_ACCESS_TOKEN}`,
        },
      }
    )
    .then((res) => {
      console.log("res", res.data.fields);
      response = res?.data?.fields || [];
    })
    .catch((error) => {
      console.error("Error fetching data:", error.message);
      response = error.message;
    });

  return {
    data: response,
  };
}

module.exports = apiHandler({
  GET: getpreviewBlog,
});
