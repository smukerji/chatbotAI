"use client";
import { message } from "antd";
import axios from "axios";
import { url } from "inspector";
import Link from "next/link";
import React, { useEffect, useState } from "react";

function RecentPosts() {
  const [currentBlog, setCurrentBlog]: any[] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    axios
      .get(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}blog/api/allblogs?currentPage=1&category=Allcategory`
      )
      .then((res) => {
        if (res?.data?.data?.total === 0) {
          message.error("No posts to show");
          setCurrentBlog([]);
        } else if (res?.data?.data) {
          // setBlog(res?.data?.data[0]);
          setCurrentBlog(res?.data?.data?.items || []);
        } else {
          message.error("Error fetching blogs. Please, try again.");
        }
      })
      .catch((err) => {
        console.log("Error", err);

        message.error("Error fetching blogs. Please, try again.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Render only the first post in the hero section
  const heroPost = currentBlog[0];

  // Render only the next 3 posts (2, 3, and 4) in the recent posts section
  const recentPosts = currentBlog?.slice(1, 4);

  return (
    <>
      <div className="recent-posts-wrapper">
        {heroPost && (
          <div
            className="hero-post"
            style={{
              backgroundImage: `url(${heroPost?.thumbnail?.url})`,
              backgroundRepeat: "no-repeat",
              backgroundSize: "100% 100%",
            }}
          >
            {heroPost?.tags?.length > 0 &&
              heroPost?.tags?.map((tag: any, index: number) => {
                return (
                  <p className="tags" key={index}>
                    <span key={index}>{tag}</span>
                  </p>
                );
              })}
            <Link href={`/blog/${heroPost?.slug}`} className="link">
              <h3 className="card-title">{heroPost?.title}</h3>
              <p className="description">{heroPost?.description}</p>
            </Link>
          </div>
        )}
        <div className="recent-posts">
          {recentPosts?.map((blog: any) => (
            <>
              <div className="author-date">
                <p className="author">{blog?.author || ""}</p>
                {/* <p className="empty"></p> */}
                <p className="date">
                  {blog?.publishDate
                    ?.split("T")[0]
                    .split("-")
                    .reverse()
                    .join("-") || ""}
                </p>
              </div>

              <Link href={`/blog/${blog?.slug}`} className="link">
                <h3 className="card-title">{blog?.title}</h3>
                <p className="description">{blog?.description}</p>
              </Link>

              <div className="category-feedback">
                <div className="category-tags">
                  {blog?.tags?.length > 0 &&
                    blog?.tags?.map((tag: any, index: number) => {
                      return (
                        <p className="tags" key={index}>
                          <span key={index}>{tag}</span>
                        </p>
                      );
                    })}
                  {
                    blog?.category?.length > 0 && (
                      // blog?.category?.map((tag: any, index: number) => {
                      // return (
                      <p className="category">
                        <span>{blog?.category}</span>
                      </p>
                    )
                    // );
                  }
                </div>
              </div>
              <hr className="hr-line" />
            </>
          ))}
        </div>
      </div>
    </>
  );
}

export default RecentPosts;
