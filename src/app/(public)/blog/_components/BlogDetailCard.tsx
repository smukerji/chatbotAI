import React from "react";
import AuthorSocialMedia from "./AuthorSocialMedia";
import BlogShareSocialMedia from "./BlogShareSocialMedia";
import { data } from "../blogData.json";
import AuthorProfile from "./AuthorProfile";

const BlogDetailCard = ({ slug }: { slug: string }) => {
  let sid = slug.split("-").join(" ");

  const blogDetail = data.filter((blog) => blog.title === sid)?.[0];
  return (
    <div className="detail-card-wrapper">
      <div className="card-about">
        <strong className="category">{blogDetail.category}</strong>
        <p className="read">{blogDetail.read} MIN READ</p>
      </div>

      <h1 className="title">{blogDetail.title}</h1>
      {/* blog share social media */}
      <div className="blog-social-share">
        <p>Social Media :</p>
        <BlogShareSocialMedia slug={slug} />
      </div>
      <div className="content-spacer-line"></div>
      {/* blog share social media */}

      <div className="blog-content">
        {/* blog detail content */}
        <div
          dangerouslySetInnerHTML={{
            __html: blogDetail.content || `<div>blog</div>`,
          }}
          className="blog-detail"
        />
        {/* author social media */}
        <AuthorSocialMedia socialLinks={blogDetail.author.socialLinks} />
        <AuthorProfile
          profileImage={blogDetail.author?.profile}
          name={blogDetail.author?.name}
        />
      </div>
    </div>
  );
};

export default BlogDetailCard;
