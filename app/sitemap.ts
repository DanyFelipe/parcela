import type { MetadataRoute } from 'next';

import { getActiveLotIds } from '@/lib/showroom/lot-data';

function getSiteUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL;

  if (!url) {
    throw new Error(
      'NEXT_PUBLIC_SITE_URL is not defined. It is required to generate absolute URLs in the sitemap.'
    );
  }

  return url;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();
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
