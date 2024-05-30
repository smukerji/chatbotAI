import { MetadataRoute } from "next";
import { getAllBlogs } from "./_helpers/blogContent";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const blogs = await getAllBlogs();
  const blogSiteMap = blogs?.map((blog) => {
    return {
      url: `https://torri.ai/blog/${blog.slug}`,
      changeFrequency: "weekly",
      lastModified: blog.date,
      priority: 0.7,
    };
  });
  return [
    {
      url: "https://torri.ai",
      changeFrequency: "monthly",
      lastModified: new Date().toISOString(),
      priority: 1,
    },

    {
      url: "https://torri.ai/home/pricing",
      changeFrequency: "monthly",
      lastModified: new Date().toISOString(),
      priority: 0.9,
    },
    {
      url: "https://torri.ai/terms",
      changeFrequency: "yearly",
      lastModified: new Date().toISOString(),
      priority: 0.11,
    },
    {
      url: "https://torri.ai/privacy",

      changeFrequency: "yearly",
      lastModified: new Date().toISOString(),
      priority: 0.12,
    },
    {
      url: "https://torri.ai/blog",
      changeFrequency: "weekly",
      lastModified: new Date().toISOString(),
      priority: 0.9,
    },
    ...blogSiteMap,
  ];
}
