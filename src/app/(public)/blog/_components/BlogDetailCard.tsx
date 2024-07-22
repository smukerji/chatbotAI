"use client";
import React, { useEffect } from "react";
import AuthorSocialMedia from "./AuthorSocialMedia";
import BlogShareSocialMedia from "./BlogShareSocialMedia";
import { data } from "../blogData.json";
import AuthorProfile from "./AuthorProfile";
import Markdown from "markdown-to-jsx";
import Image from "next/image";
const BlogDetailCard = ({
  heroImage,
  content,
  title,
  author,
  date,
  introduction,
}: {
  heroImage: any;
  content: any;
  title: string;
  author: string;
  date: string;
  introduction: any;
}) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <Image
        src={heroImage || ""}
        width={1200}
        height={500}
        className="banner-image"
        alt={`${title} banner image`}
      />

      <div className="detail-card-wrapper" id="blog-detail-wrapper">
        <div className="card-about">
          <p className="category">{author}</p>
          <p className="empty"></p>
          <p className="date">{date}</p>
        </div>
        <h1 className="title">{title}</h1>
        {introduction && (
          <div className="introduction">
            {introduction.map((para: string, index: number) => {
              return <Markdown key={index}>{para}</Markdown>;
            })}
          </div>
        )}

        <div className="blog-content">
          <Markdown>{content}</Markdown>
        </div>
      </div>
    </>
  );
};

export default BlogDetailCard;
