import Footer from "@/app/_components/Footer/Footer";
import SecondaryHeader from "@/app/_components/Secondary-Header/SecondaryHeader";
import React from "react";
import "./blog.scss";
import BlogCard from "./_components/BlogCard";
import { generateMetadata } from "@/app/_helpers/pageSeo";
export const metadata = generateMetadata({
  title: "Blog",
  canonical: "/blog",
});

const Blog = () => {
  return (
    <>
      <SecondaryHeader />
      <div className="blog-wrapper">
        <div className="blog-container">
          <div className="blog-header">Blog</div>
          {/** blog card component */}
          <BlogCard />
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Blog;
