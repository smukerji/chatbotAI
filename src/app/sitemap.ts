type Sitemap = Array<{
  url: string;
  lastModified?: string | Date;
  priority?: number;
}>;

export default function sitemap(): Sitemap {
  return [
    {
      url: 'http://localhost:3000/',
      lastModified: new Date(),
      priority: 1,
    },
    {
      url: 'http://localhost:3000/home/pricing',
      lastModified: new Date(),
      priority: 0.9,
    },
    {
      url: 'http://localhost:3000/terms',
      lastModified: new Date(),
      priority: 0.11,
    },
    {
      url: 'http://localhost:3000/privacy',
      lastModified: new Date(),
      priority: 0.12,
    },
  ];
}
