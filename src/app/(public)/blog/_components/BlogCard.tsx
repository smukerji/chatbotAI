"use client";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { Pagination } from "antd";
import { useRouter, useSearchParams } from "next/navigation";

const BlogCard = ({
  blogs,
  initialPage,
  pageCount,
  total,
}: {
  blogs: any;
  initialPage: number;
  pageCount: number;
  total: number;
}) => {
  const router = useRouter();
  const search = useSearchParams();
  const [currentPage, setCurrentPage] = useState(initialPage || 1);
  const [currentBlog, setCurrentBlog] = useState([]);
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    router.push(`/blog?page=${page}`);
  };
  useEffect(() => {
    const postsPerPage = 10;
    const indexOfLastPost = currentPage * postsPerPage;
    const indexOfFirstPost = indexOfLastPost - postsPerPage;
    const currentPosts = blogs.slice(indexOfFirstPost, indexOfLastPost);
    setCurrentBlog(currentPosts);
  }, [currentPage]);

  useEffect(() => {
    const currentPageNo = search?.get("page") ?? 1;
    setCurrentPage(Number(currentPageNo));
    router.push(`/blog?page=${currentPageNo || 1}`);
    const postsPerPage = 10;
    const indexOfLastPost = Number(currentPageNo) * postsPerPage;
    const indexOfFirstPost = indexOfLastPost - postsPerPage;
    const currentPosts = blogs.slice(indexOfFirstPost, indexOfLastPost);
    setCurrentBlog(currentPosts);
  }, []);
  return (
    <div className="blog-card-wrapper">
      {currentBlog?.map((blog: any) => (
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
        pageSize={10}
        current={currentPage}
        total={total}
        onChange={handlePageChange}
        itemRender={(page, type, originalElement) => {
          if (type === "prev") {
            return <Link href={`/blog?page=${page}`}>Previous</Link>;
          }
          if (type === "next") {
            return <Link href={`/blog?page=${page}`}>Next</Link>;
          }
          return <Link href={`/blog?page=${page}`}>{page}</Link>;
        }}
      />
    </div>
  );
};

export default BlogCard;
