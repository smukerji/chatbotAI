import Footer from "@/app/_components/Footer/Footer";
import SecondaryHeader from "@/app/_components/Secondary-Header/SecondaryHeader";
import React from "react";
import "../blogDetail.scss";
import { data } from "../blogData.json";
import Image from "next/image";
import BlogDetailCard from "../_components/BlogDetailCard";
import { Metadata } from "next";
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const blogDetail = data.filter((blog) => blog.slug === params.slug)?.[0];

  return {
    title: `Blog | ${blogDetail.title}`,
    alternates: {
      canonical: `https://torri.ai/blog/${blogDetail.slug}`,
    },
  };
}
const BlogDetail = ({ params }: { params: { slug: string } }) => {
  const blogDetail = data.filter((blog) => blog.slug === params.slug)?.[0];
  return (
    <>
      <SecondaryHeader />
      <div className="blog-detail-container">
        <Image
          src={blogDetail.url}
          width={1200}
          height={500}
          objectFit="contain"
          className="banner-image"
          alt={`${blogDetail.title} banner image`}
        />
        <BlogDetailCard slug={params.slug} />
      </div>
      <Footer />
    </>
  );
};

export default BlogDetail;
