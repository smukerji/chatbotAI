import Footer from "@/app/_components/Footer/Footer";
import SecondaryHeader from "@/app/_components/Secondary-Header/SecondaryHeader";
import React from "react";
import BlogShareSocialMedia from "../_components/BlogShareSocialMedia";
import "../blogDetail.scss";
import { data } from "../blogData.json";
import Image from "next/image";
import BlogDetailCard from "../_components/BlogDetailCard";
const BlogDetail = ({ params }: { params: { slug: string } }) => {
  let sid = params.slug.split("-").join(" ");

  const blogDetail = data.filter((blog) => blog.title === sid)?.[0];
  return (
    <>
      <SecondaryHeader />
      <div className="blog-detail-container">
        <Image
          src={blogDetail.url}
          width={1200}
          height={500}
          className="banner-image"
          alt="Blog detail banner image"
        />
        <BlogDetailCard slug={params.slug} />
      </div>
      <Footer />
    </>
  );
};

export default BlogDetail;
