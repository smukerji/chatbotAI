import { apiHandler } from "@/app/_helpers/server/api/api-handler";
import { message } from "antd";
import axios from "axios";
import { NextRequest } from "next/server";

// Function to get single blog from contentful api

async function getBlogs(request: NextRequest) {
  const limit = 9;
  const { pageNumber }: any = request.nextUrl.searchParams;
  const skip = (pageNumber - 1) * limit;

  console.log(pageNumber);

  const query = `
  query {
    blogCollection(limit: ${limit}, skip: ${skip}, order: publishDate_DESC) {
    total
      items {
        id
        thumbnail {
          url
        }
        title
        description
        author
        publishDate
        tags
        category
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
      `https://graphql.contentful.com/content/v1/spaces/${process.env.CONTENTFUL_SPACE_ID}`,
      body,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.CONTENTFUL_ACCESS_TOKEN}`,
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
  GET: getBlogs,
});
