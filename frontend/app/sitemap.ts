import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://xianze.tech').replace(/\/$/, '');

  // Static routes
  const routes = [
    '',
    '/register',
    '/events',
    '/contact',
    '/faq',
    '/paper-submission',
    '/schedule',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  return routes;
}
