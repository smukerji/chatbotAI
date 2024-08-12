import { apiHandler } from "@/app/_helpers/server/api/api-handler";
import { message } from "antd";
import axios from "axios";
import { NextRequest } from "next/server";

// Function to get single blog from contentful api

async function getSingleBlog(request: NextRequest) {
  console.log("coming in request");

  const slug = request.nextUrl.searchParams.get("slug") || "";

  const query = `
  query {
    blogCollection(where: {slug: "${slug}"}) {
      items {
        id
        heroImage {
          url
        }
        title
        author
        introPara
        content
        publishDate
        description
        contentfulMetadata{
          tags{
            name
          }
        }
      }
    }
  }
`;

  const body = {
    query: query,
  };

  let response;

  await axios
    .post(
      `https://graphql.contentful.com/content/v1/spaces/${process.env.NEXT_PUBLIC_CONTENTFUL_SPACE_ID}`,
      body,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_CONTENTFUL_ACCESS_TOKEN}`,
        },
      }
    )
    .then((res) => {
      response = res?.data?.data?.blogCollection?.items || [];
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
  GET: getSingleBlog,
});
