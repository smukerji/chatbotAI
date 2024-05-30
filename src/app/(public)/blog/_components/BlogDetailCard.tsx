import React from "react";
import AuthorSocialMedia from "./AuthorSocialMedia";
import BlogShareSocialMedia from "./BlogShareSocialMedia";
import { data } from "../blogData.json";
import AuthorProfile from "./AuthorProfile";
import Markdown from "markdown-to-jsx";
const BlogDetailCard = ({
  content,
  title,
  author,
  date,
  introduction,
}: {
  content: any;
  title: string;
  author: string;
  date: string;
  introduction: any;
}) => {
  return (
    <div className="detail-card-wrapper">
      <div className="card-about">
        <p className="category">{author}</p>
        <p className="empty"></p>
        <p className="date">{date}</p>
      </div>
      <h1 className="title">{title}</h1>
      {introduction && (
        <div className="introduction">
          {introduction.map((para: string, index: number) => {
            return <p key={index}>{para}</p>;
          })}
        </div>
      )}

      <div className="blog-content">
        <Markdown>{content}</Markdown>
      </div>
    </div>
  );
};

export default BlogDetailCard;
