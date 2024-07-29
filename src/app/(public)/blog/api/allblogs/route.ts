import { apiHandler } from "@/app/_helpers/server/api/api-handler";
import { message } from "antd";
import axios from "axios";
import { NextRequest } from "next/server";

// Function to get single blog from contentful api

async function getBlogs(request: NextRequest) {
  const category: string = request.nextUrl.searchParams.get("category") || "";

  const limit: any = process.env.NEXT_PUBLIC_BLOG_POST_PER_PAGE;
  const currentPage: number =
    Number(request.nextUrl.searchParams.get("currentPage")) || 1;
  const skip = (currentPage - 1) * limit;

  let whereClause = "";
  if (category !== "Allcategory") {
    whereClause = `, where:{category_contains:"${category}"}`;
  }

  const query = `
  query {
    blogCollection(limit: ${limit}, skip: ${skip}, order: publishDate_DESC${whereClause}) {
    total
      items {
        thumbnail {
          url
        }
        title
        description
        author
        publishDate
        tags
        category
        slug
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
      response = res?.data?.data?.blogCollection || [];
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
