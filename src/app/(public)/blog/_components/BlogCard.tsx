"use client";
import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";
import { Pagination } from "antd";

const BlogCard = ({
  blogs,
  initialPage,
  pageCount,
}: {
  blogs: any;
  initialPage: number;
  pageCount: number;
}) => {
  const [currentPage, setCurrentPage] = useState(initialPage || 0);

  const handlePageChange = (data: any) => {
    setCurrentPage(data.selected);
  };

  const postsPerPage = 10;
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  // const currentPosts = blogs.slice(indexOfFirstPost, indexOfLastPost);
  return (
    <div className="blog-card-wrapper">
      {blogs?.map((blog: any) => (
        <div className="blog-card" key={blog.title}>
          <Link href={`/blog/${blog.slug}`}>
            <div className="card-header">
              <Image
                src={blog.thumbnail}
                alt={`Image of ${"title"}`}
                width={400}
                height={300}
                loading="lazy"
              />
            </div>
            <div className="card-footer">
              <div className="card-about">
                <p className="author">{blog.author}</p>
                <p className="empty"></p>
                <p className="date">{blog.date}</p>
              </div>
              <h3 className="card-title">
                {blog.title} {blog.id}
              </h3>
              <p className="description">{blog.description}</p>
            </div>
          </Link>
        </div>
      ))}
      <Pagination
        pageSize={pageCount}
        current={currentPage}
        onChange={handlePageChange}
      />
    </div>
  );
};

export default BlogCard;
