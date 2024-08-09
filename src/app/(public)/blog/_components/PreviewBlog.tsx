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

const PreviewBlog = ({ slug }: { slug: string }) => {
  const [blog, setBlog] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState("");

  // fetch blog using specific slug
  useEffect(() => {
    setLoading(true);
    axios
      .get(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}blog/api/previewblog?slug=${slug}`
      )
      .then((res) => {
        if (res?.data?.data) {
          setBlog(res?.data?.data);
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

  useEffect(() => {
    if (blog) {
      const body = {
        assetId: blog?.heroImage?.sys?.id || "",
      };
      setLoading(true);
      axios
        .post(
          `${process.env.NEXT_PUBLIC_WEBSITE_URL}blog/api/previewblog`,
          body
        )
        .then((res) => {
          if (res?.data?.data) {
            setImageUrl(`https:${res?.data?.data?.file?.url}`);
            // setBlog(res?.data?.data);
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
    }

    window.scrollTo(0, 0);
  }, [blog]);

  return (
    <>
      {loading && <Spin indicator={antIcon} />}
      {!loading && blog && (
        <>
          <Image
            src={imageUrl}
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

            <div className="category-tags">
              {blog?.contentfulMetadata?.tags?.length > 0 &&
                blog?.contentfulMetadata?.tags?.map(
                  (tag: any, index: number) => {
                    return (
                      <p className="tags" key={index}>
                        <span key={index}>{tag.name}</span>
                      </p>
                    );
                  }
                )}
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

export default PreviewBlog;
