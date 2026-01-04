import { MetadataRoute } from 'next';

/**
 * Dynamic sitemap generation for PicPip.co
 * This helps search engines discover and index public pages efficiently
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://picpip.co';
  const currentDate = new Date();

  // Public pages that should be indexed
  const publicPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/help`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  return publicPages;
}

