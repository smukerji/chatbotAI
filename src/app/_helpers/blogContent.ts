import matter from "gray-matter";
import fs from "fs";

const contentDir = process.cwd() + "/src/app/_helpers/content/blogs";
export async function getAllBlogs() {
  const files = await fs.promises.readdir(contentDir);
  const blogs = await Promise.all(
    files.map(async (filename) => {
      const content = await fs.promises.readFile(
        `${contentDir}/${filename}`,
        "utf8"
      );
      const { data } = matter(content);

      return { ...data };
    })
  );
  return blogs.sort((a: any, b: any) => a.id - b.id);
}

export async function getBlogBySlug(slug: string) {
  const filename = `${contentDir}/${slug}.md`;
  try {
    const content = await fs.promises.readFile(filename, "utf8");
    const { data, content: markdownContent } = matter(content);
    return { ...data, content: content };
  } catch (error) {
    return null;
  }
}
