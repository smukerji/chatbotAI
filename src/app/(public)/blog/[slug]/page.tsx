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
    title: `Blog | ${blogDetail?.metaTitle}`,
    description: `${blogDetail?.metaDescription}`,
    alternates: {
      canonical: `https://torri.ai/blog/${blogDetail?.slug}`,
    },
  };
}

const getBlogDetail = async ({ slug }: { slug: string }) => {
  const blog = await getBlogBySlug(slug);
  return { blog };
};

const BlogDetail = async ({
  params: { slug },
}: {
  params: { slug: string };
}) => {
  const { blog }: { blog: any } = await getBlogDetail({ slug });

  return (
    <>
      <SecondaryHeader />
      <div className="blog-detail-container">
        {blog && (
          <div className="blog-detail">
            <Image
              src={blog.hero || ""}
              width={1200}
              height={500}
              className="banner-image"
              alt={`${blog?.title} banner image`}
            />
            <BlogDetailCard
              content={blog.content}
              title={blog.title}
              author={blog.author}
              date={blog.date}
              introduction={blog.introduction}
            />
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default BlogDetail;
