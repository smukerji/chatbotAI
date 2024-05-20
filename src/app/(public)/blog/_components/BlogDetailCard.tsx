import React from "react";
import AuthorSocialMedia from "./AuthorSocialMedia";
import BlogShareSocialMedia from "./BlogShareSocialMedia";
import { data } from "../blogData.json";

const BlogDetailCard = ({ slug }: { slug: string }) => {
  let sid = slug.split("-").join(" ");

  const blogDetail = data.filter((blog) => blog.title === sid)?.[0];
  return (
    <div className="detail-card-wrapper">
      <h1 className="title">{blogDetail.title}</h1>

      <div className="content-spacer-line"></div>
      {/* blog share social media */}

      <div className="blog-content">
        {/* blog share social media */}
        <BlogShareSocialMedia />

        {/* blog detail content */}
        {/* author social media */}
        <AuthorSocialMedia />
      </div>
    </div>
  );
};

export default BlogDetailCard;
