import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

const BASE_URL = 'https://marketshare.kr';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${BASE_URL}/products`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/brands`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/malls`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/search`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BASE_URL}/pricing`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/franchise`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/auth/login`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE_URL}/auth/register`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE_URL}/create-mall`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/supplier/apply`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ];

  // TODO: Add dynamic product pages from Firestore when deployed
  // const products = await getActiveProducts();
  // const productPages = products.map(p => ({
  //   url: `${BASE_URL}/products/${p.id}`,
  //   lastModified: p.updatedAt,
  //   changeFrequency: 'weekly' as const,
  //   priority: 0.8,
  // }));

  return [...staticPages];
}
