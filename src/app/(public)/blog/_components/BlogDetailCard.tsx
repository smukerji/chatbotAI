"use client";
import React, { useEffect, useState } from "react";
import AuthorSocialMedia from "./AuthorSocialMedia";
import BlogShareSocialMedia from "./BlogShareSocialMedia";
import { data } from "../blogData.json";
import AuthorProfile from "./AuthorProfile";
import Markdown from "markdown-to-jsx";
import Image from "next/image";
import axios from "axios";
import { message, Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";

const antIcon = (
  <LoadingOutlined
    style={{ fontSize: 24, color: "black", textAlign: "center" }}
    spin
  />
);

const BlogDetailCard = ({ slug }: { slug: string }) => {
  const [blog, setBlog] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // fetch blog using specific slug
  useEffect(() => {
    setLoading(true);
    axios
      .get(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}blog/api/singleblog?slug=${slug}`
      )
      .then((res) => {
        if (res?.data?.data) {
          setBlog(res?.data?.data[0]);
        } else {
          message.error("Error fetching blog. Please, try again.");
        }
      })
      .catch((err) => {
        console.log("Error", err);

        message.error("Error fetching blog. Please, try again.");
      })
      .finally(() => {
        setLoading(false);
      });

    window.scrollTo(0, 0);
  }, []);

  // Update metadata after fetching blog data
  useEffect(() => {
    if (blog) {
      const metadata = {
        title: `Blog ${blog?.title ? ` | ${blog?.title}` : ""}`,
        description: `${blog?.description}`,
        alternates: {
          canonical: `https://torri.ai/blog/${slug}`,
        },
      };
      // Update metadata
      document.title = metadata.title;
      // Example for setting meta description
      const metaDescription = document.querySelector(
        'meta[name="description"]'
      );
      if (metaDescription) {
        metaDescription.setAttribute("content", metadata.description);
      }
    }
  }, [blog]);

  return (
    <>
      {loading && <Spin indicator={antIcon} />}
      {!loading && blog && (
        <>
          <Image
            src={blog?.heroImage?.url || ""}
            width={1200}
            height={500}
            className="banner-image"
            alt={`${blog?.title} banner image`}
          />

          <div className="detail-card-wrapper" id="blog-detail-wrapper">
            <div className="card-about">
              <p className="category">{blog?.author || ""}</p>
              {/* <p className="empty"></p> */}
              <p className="date">
                {blog?.publishDate
                  ?.split("T")[0]
                  .split("-")
                  .reverse()
                  .join("-") || ""}
              </p>
            </div>
            <h1 className="title">{blog?.title || ""}</h1>
            <div className="introduction">
              <Markdown key={blog?.id}>{blog?.introPara || ""}</Markdown>
            </div>

            <div className="blog-content">
              <Markdown>{blog?.content || ""}</Markdown>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default BlogDetailCard;
