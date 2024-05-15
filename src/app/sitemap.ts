type Sitemap = Array<{
  url: string;
  lastModified?: string | Date;
  priority?: number;
}>;

export default function sitemap(): Sitemap {
  return [
    {
      url: 'https://torri.ai',
      lastModified: new Date(),
      priority: 1,
    },
    {
      url: 'https://torri.ai/home/pricing',
      lastModified: new Date(),
      priority: 0.9,
    },
    {
      url: 'https://torri.ai/terms',
      lastModified: new Date(),
      priority: 0.11,
    },
    {
      url: 'https://torri.ai/privacy',
      lastModified: new Date(),
      priority: 0.12,
    },
  ];
}
