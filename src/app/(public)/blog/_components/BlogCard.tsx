"use client";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { message, Pagination, Spin } from "antd";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { LoadingOutlined } from "@ant-design/icons";
import LikeIcon from "../../../../../public/svgs/like.svg";
import commentIcon from "../../../../../public/svgs/messages.svg";
import CaseStudyIcon from "@/assets/svg/CaseStudyIcon";
import Icon from "@/app/_components/Icon/Icon";
import ResearchIcon from "@/assets/svg/ResearchIcon";
import CompanyIcon from "@/assets/svg/CompanyIcon";
import StoriesIcon from "@/assets/svg/StoriesIcon";
import AllCategoryIcon from "@/assets/svg/AllCategoryIcon";

const antIcon = (
  <LoadingOutlined
    style={{ fontSize: 24, color: "black", textAlign: "center" }}
    spin
  />
);

const BlogCard = () => {
  const router = useRouter();
  const search = useSearchParams();
  const postsPerPage: any = process.env.NEXT_PUBLIC_BLOG_POST_PER_PAGE;
  const [currentPage, setCurrentPage] = useState(1);
  const [currentBlog, setCurrentBlog] = useState([]);
  const [totalPosts, setTotalPosts] = useState(1);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState("Allcategory");

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    router.push(`/blog?page=${page}&category=${activeCategory}`);
  };

  const handleChangeCategory = (category: string) => {
    setActiveCategory(category);
    setCurrentPage(1);
    router.push(`/blog?page=1&category=${category}`);
  };

  useEffect(() => {
    setLoading(true);
    const currentPageNo = search?.get("page") ?? 1;
    const currentCategory = search?.get("category") ?? "Allcategory";
    setCurrentPage(Number(currentPageNo));
    setActiveCategory(currentCategory);
    router.push(`/blog?page=${currentPageNo || 1}&category=${currentCategory}`);
    setLoading(false);
  }, []);

  useEffect(() => {
    setLoading(true);
    axios
      .get(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}blog/api/allblogs?currentPage=${currentPage}&category=${activeCategory}`
      )
      .then((res) => {
        if (res?.data?.data?.total === 0) {
          message.error("No posts to show");
          setCurrentBlog([]);
        } else if (res?.data?.data) {
          // setBlog(res?.data?.data[0]);
          setCurrentBlog(res?.data?.data?.items || []);
          setTotalPosts(res?.data?.data?.total);
          console.log(res.data.data);
        } else {
          message.error("Error fetching blogs. Please, try again.");
        }
      })
      .catch((err) => {
        console.log("Error", err);

        message.error("Error fetching blogs. Please, try again.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [currentPage, activeCategory]);

  // useEffect(() => {
  //   window.scrollTo(0, 0);
  // }, []);
  return (
    <>
      {loading && <Spin indicator={antIcon} />}
      {!loading && currentBlog && (
        <>
          <div className="category-wrapper">
            <div
              className={`category ${
                activeCategory === "Allcategory" ? "active" : ""
              }`}
              onClick={() =>
                // setActiveCategory("Allcategory"), setCurrentPage(1);
                handleChangeCategory("Allcategory")
              }
            >
              <Icon Icon={AllCategoryIcon} />
              <p>All categories</p>
            </div>

            <div
              className={`category ${
                activeCategory === "Casestudy" ? "active" : ""
              }`}
              onClick={() => {
                handleChangeCategory("Casestudy");
              }}
            >
              <Icon Icon={CaseStudyIcon} />
              <p>Casestudy</p>
            </div>

            <div
              className={`category ${
                activeCategory === "Research" ? "active" : ""
              }`}
              onClick={() => {
                handleChangeCategory("Research");
              }}
            >
              <Icon Icon={ResearchIcon} />
              <p>Research</p>
            </div>

            <div
              className={`category ${
                activeCategory === "Company" ? "active" : ""
              }`}
              onClick={() => {
                handleChangeCategory("Company");
              }}
            >
              <Icon Icon={CompanyIcon} />
              <p>Company</p>
            </div>

            <div
              className={`category ${
                activeCategory === "Stories" ? "active" : ""
              }`}
              onClick={() => {
                handleChangeCategory("Stories");
              }}
            >
              <Icon Icon={StoriesIcon} />
              <p>Stories</p>
            </div>
          </div>

          <div className="blog-card-wrapper">
            {currentBlog?.map((blog: any) => (
              <div className="blog-card" key={blog?.title}>
                <Link href={`/blog/${blog?.slug}`}>
                  <div className="card-header">
                    <Image
                      src={blog?.thumbnail?.url}
                      alt={`Image of ${blog?.title}`}
                      width={400}
                      height={300}
                      loading="lazy"
                    />
                  </div>
                </Link>
                <div className="card-footer">
                  <div className="card-about">
                    <p className="author">{blog?.author || ""}</p>
                    {/* <p className="empty"></p> */}
                    <p className="date">
                      {blog?.publishDate
                        ?.split("T")[0]
                        .split("-")
                        .reverse()
                        .join("-") || ""}
                    </p>
                  </div>
                  <Link href={`/blog/${blog?.slug}`}>
                    <h3 className="card-title">{blog?.title}</h3>
                    <p className="description">{blog?.description}</p>
                  </Link>

                  <div className="category-feedback">
                    <div className="category-tags">
                      {blog?.tags?.length > 0 &&
                        blog?.tags?.map((tag: any, index: number) => {
                          return (
                            <p className="tags">
                              <span key={index}>{tag}</span>
                            </p>
                          );
                        })}
                      {blog?.category?.length > 0 &&
                        blog?.category?.map((tag: any, index: number) => {
                          return (
                            <p className="category">
                              <span key={index}>{tag}</span>
                            </p>
                          );
                        })}
                    </div>
                    <div className="likes-comment">
                      <p className="likes">
                        <span className="icon">
                          <Image src={LikeIcon} alt="icon" />
                        </span>
                        10
                      </p>
                      <p className="comment">
                        <span className="icon">
                          <Image src={commentIcon} alt="icon" />
                        </span>{" "}
                        10
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {currentBlog.length > 0 && (
              <Pagination
                pageSize={postsPerPage}
                current={currentPage}
                total={totalPosts}
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
            )}
          </div>
        </>
      )}
    </>
  );
};

export default BlogCard;
