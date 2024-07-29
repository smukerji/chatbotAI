import Footer from "@/app/_components/Footer/Footer";
import SecondaryHeader from "@/app/_components/Secondary-Header/SecondaryHeader";
import React from "react";
import "../blogDetail.scss";
import { data } from "../blogData.json";
import Image from "next/image";
import BlogDetailCard from "../_components/BlogDetailCard";
import { Metadata } from "next";
import { getBlogBySlug } from "@/app/_helpers/blogContent";
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const blogDetail: any = await getBlogBySlug(params.slug);

  return {
    title: `Blog ${blogDetail?.metaTitle ? ` | ${blogDetail?.metaTitle}` : ""}`,
    description: `${blogDetail?.metaDescription}`,
    alternates: {
      canonical: `https://torri.ai/blog/${blogDetail?.slug}`,
    },
  };
}

const BlogDetail = async ({
  params: { slug },
}: {
  params: { slug: string };
}) => {
  return (
    <>
      <SecondaryHeader />
      <div className="blog-detail-container">
        <div className="blog-detail">
          <BlogDetailCard slug={slug} />
        </div>
      </div>
      <Footer />
    </>
  );
};

export default BlogDetail;
