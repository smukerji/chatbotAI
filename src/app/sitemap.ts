import { MetadataRoute } from "next";
import axios from "axios";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const fetchBlogs = async () => {
    try {
      // Make the API request to fetch blog data
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}blog/api/allslugs`
      );
      return response.data.data.items || [];
    } catch (error) {
      console.error("Error fetching blog data:", error);
      // Return an empty array or handle the error as needed
      return [];
    }
  };

  // Fetch blog data
  const blogs = await fetchBlogs();

  // Generate sitemap entries for blogs
  const blogSiteMap = blogs.map((blog: any) => {
    return {
      url: `https://torri.ai/blog/${blog.slug}`,
      changeFrequency: "weekly",
      lastModified: blog.publishDate || new Date().toISOString(),
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
