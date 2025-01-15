import React from "react";
import SecondaryHeader from "../../../../../app/_components/Secondary-Header/SecondaryHeader";
import Footer from "../../../../../app/_components/Footer/Footer";
import PreviewBlog from "../../_components/PreviewBlog";
import "../../blogDetail.scss";

// export async function generateMetadata({
//   params,
// }: {
//   params: { slug: string };
// }): Promise<Metadata> {
//   const blogDetail: any = await getBlogBySlug(params.slug);

//   return {
//     title: `Blog ${blogDetail?.metaTitle ? ` | ${blogDetail?.metaTitle}` : ""}`,
//     description: `${blogDetail?.metaDescription}`,
//     alternates: {
//       canonical: `https://torri.ai/blog/${blogDetail?.slug}`,
//     },
//   };
// }

const PreviewBlogDetail = async ({
  params: { slug },
}: {
  params: { slug: string };
}) => {
  return (
    <>
      <SecondaryHeader />
      <div className="blog-detail-container">
        <div className="blog-detail">
          <PreviewBlog slug={slug} />
        </div>
      </div>
      <Footer />
    </>
  );
};

export default PreviewBlogDetail;
