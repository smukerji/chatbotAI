import Image from "next/image";
import Link from "next/link";
import React from "react";
import { data } from "../blogData.json";

const BlogCard = () => {
  return (
    <div className="blog-card-wrapper">
      {data.map((blog) => (
        <div className="blog-card" key={blog.title}>
          <Link href={`/blog/${blog.title?.split(" ").join("-")}`}>
            <div className="card-header">
              <Image
                src={blog.thumbnailUrl}
                alt={`Image of ${"title"}`}
                width={400}
                height={300}
              />
            </div>
            <div className="card-footer">
              <div className="card-about">
                <button className="category-button">{blog.category}</button>
                <p className="read">{blog.read} MIN READ</p>
              </div>
              <h3 className="card-title">{blog.title}</h3>
            </div>
          </Link>
        </div>
      ))}
    </div>
  );
};

export default BlogCard;
