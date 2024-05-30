import React from "react";
import AuthorSocialMedia from "./AuthorSocialMedia";
import BlogShareSocialMedia from "./BlogShareSocialMedia";
import { data } from "../blogData.json";
import AuthorProfile from "./AuthorProfile";

const BlogDetailCard = ({
  content,
  title,
  author,
  date,
}: {
  content: any;
  title: string;
  author: string;
  date: string;
}) => {
  return (
    <div className="detail-card-wrapper">
      <div className="card-about">
        <p className="category">{author}</p>
        <p className="empty"></p>
        <p className="date">{date}</p>
      </div>
      <h1 className="title">{title}</h1>

      <div className="blog-content">
        <div
          dangerouslySetInnerHTML={{
            __html: content || `<div>blog</div>`,
          }}
        />
      </div>
    </div>
  );
};

export default BlogDetailCard;
