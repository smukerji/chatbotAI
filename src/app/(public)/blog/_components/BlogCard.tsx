"use client";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";
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

  const [categories, setCategories] = useState<string[]>([]);

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
  }, [search]);

  useEffect(() => {
    const savedCategories = sessionStorage.getItem("categories");
    if (savedCategories) {
      setCategories(JSON.parse(savedCategories));
    }
  }, []);

  useEffect(() => {
    if (
      activeCategory !== "Allcategory" ||
      (activeCategory === "Allcategory" &&
        search?.get("category") === "Allcategory")
    ) {
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
            const blogPosts = res.data.data.items;

            // Update categories only if the active category is "Allcategory"
            if (activeCategory === "Allcategory" && categories.length === 0) {
              const fetchedCategories = blogPosts.map(
                (blog: any) => blog.category
              );
              const uniqueCategories: string[] = fetchedCategories
                .filter(
                  (category: string, index: number, self: any) =>
                    self.indexOf(category) === index
                )
                .sort((a: any, b: any) => a.localeCompare(b));
              setCategories(uniqueCategories);
              sessionStorage.setItem(
                "categories",
                JSON.stringify(uniqueCategories)
              );
            }

            // skip first 4 blog as we already showing this in recent posts
            if (currentPage === 1 && activeCategory === "Allcategory") {
              setCurrentBlog(blogPosts.slice(4)); // skip first 4 blog posts
            } else {
              setCurrentBlog(blogPosts || []);
            }

            setTotalPosts(res?.data?.data?.total);
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
    }
  }, [search, activeCategory, currentPage]);

  // useEffect(() => {
  //   window.scrollTo(0, 0);
  // }, []);

  return (
    <>
      {!loading && currentBlog.length > 0 && (
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
              {/* <Icon Icon={AllCategoryIcon} /> */}
              <p>All categories</p>
            </div>

            {categories.map((category: string, index: number) => {
              return (
                <div
                  key={index}
                  className={`category ${
                    activeCategory === category ? "active" : ""
                  }`}
                  onClick={() => handleChangeCategory(`${category}`)}
                >
                  <p>{category}</p>
                </div>
              );
            })}
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
                        ? new Date(blog.publishDate).toLocaleDateString(
                            "en-GB",
                            { day: "2-digit", month: "short", year: "numeric" }
                          )
                        : ""}
                    </p>
                  </div>
                  <Link href={`/blog/${blog?.slug}`}>
                    <h3 className="card-title">{blog?.title}</h3>
                    <p className="description">{blog?.description}</p>
                  </Link>

                  <div className="category-feedback">
                    <div className="category-tags">
                      {blog?.contentfulMetadata?.tags?.length > 0 &&
                        blog?.contentfulMetadata?.tags?.map(
                          (tag: any, index: number) => {
                            return (
                              <p className="tags" key={index}>
                                <span key={index}>{tag.name}</span>
                              </p>
                            );
                          }
                        )}
                      {
                        blog?.category?.length > 0 && (
                          // blog?.category?.map((tag: any, index: number) => {
                          //   return (
                          <p className="category">
                            <span>{blog?.category}</span>
                          </p>
                        )
                        // );
                      }
                    </div>
                    {/* <div className="likes-comment">
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
                    </div> */}
                  </div>
                </div>
              </div>
            ))}

            {!loading && currentBlog.length > 0 && (
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

      {loading && <Spin indicator={antIcon} />}
    </>
  );
};

export default BlogCard;
