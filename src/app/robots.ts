import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

const BASE_URL = 'https://marketshare.kr';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/mall-admin/',
          '/api/',
          '/mypage/',
          '/checkout/',
          '/cart/',
          '/supplier/',
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
