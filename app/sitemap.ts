import type { MetadataRoute } from 'next';

import { getSiteUrl } from '@/lib/seo/site-url';
import { getActiveLotIds } from '@/lib/showroom/lot-data';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();

  if (!baseUrl) {
    console.error(
      'Sitemap skipped: no public site URL configured (NEXT_PUBLIC_SITE_URL or a Vercel URL).'
    );
    return [];
  }

  const lotIds = await getActiveLotIds();

  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
  ];

  for (const id of lotIds) {
    routes.push({
      url: `${baseUrl}/lot/${id}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    });
  }

  return routes;
}
