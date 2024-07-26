import Footer from "@/app/_components/Footer/Footer";
import SecondaryHeader from "@/app/_components/Secondary-Header/SecondaryHeader";
import React from "react";
import "./blog.scss";
import BlogCard from "./_components/BlogCard";
// import { generateMetadata } from "@/app/_helpers/pageSeo";
// import { getAllBlogs } from "@/app/_helpers/blogContent";
import Image from "next/image";
import { Metadata } from "next";
import RecentPosts from "./_components/RecentPosts";

// const getBlogList = async () => {
//   const blogs = await getAllBlogs();

//   const pageCount = Math.ceil(blogs.length / 2); // Assuming 10 posts per page

//   const totalPage = blogs.length;
//   return {
//     totalPage,
//     blogs,
//     pageCount,
//     initialPage: 0,
//   };
// };
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Blog`,
    alternates: {
      canonical: `https://torri.ai/blog`,
    },
  };
}

const Blog = async () => {
  return (
    <>
      <SecondaryHeader />
      <div className="blog-wrapper">
        <div className="blog-container">
          <div className="blog-header">Blog</div>
          {/* <div className="blog-hero-banner">
            <Image
              src={
                "https://s3-alpha-sig.figma.com/img/82d7/6cbb/74cbf896956646769b1298022186a38f?Expires=1717977600&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4&Signature=XKNbswdd8qA9BqFtJbB13TFS5Ajbw7WS52VAC6hX0DIYU~7dTX1IGGWIFQBAB0fjHm5bBHJu0S9D~fRcoYKHDjYe4XlJRDyX1r3tUjRRtDtK~4gB5~cNb4KvqKlReZ5t2AJ0kQbtaLnAfRQHRLDeG02hPd0FO8WwE19BNwxcmsDcDnaXAxfzOlYUI7VzvwDPtShAJivFmw~kCYa18smf1~Dhjzk~aMH6R-ERrAytIfH9vrzSYkCqtnU7YK4Wnu1ZYctVKUAHSTdEXCwPDIz4~Z-auHDoLa24efT9xXTBjpRx6whAVr2olSyEL0nrQeT0ZowmuYcZjMve2MBj7JNJ3g__"
              }
              width={1208}
              height={600}
              alt="blog list banner"
            />
          </div> */}
          {/** blog card component */}
          <RecentPosts />
          <BlogCard />
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Blog;
