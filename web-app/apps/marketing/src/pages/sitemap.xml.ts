import type { APIRoute } from 'astro';

const SITE_URL = 'https://acepharmexams.co.uk';

const STATIC_PAGES = [
  '',
  '/features',
  '/question-bank',
  '/ace',
  '/pricing',
  '/about',
  '/editorial-standards',
  '/faq',
  '/contact',
  '/blog',
  '/privacy',
  '/terms',
  '/cookie-policy',
  '/ai-use-policy',
  '/accessibility',
];

export const GET: APIRoute = async () => {
  const now = new Date();
  const fallbackBlogPosts = [
    { slug: 'gphc-calculations-essential-methods', publishedAt: '2026-09-18T09:00:00Z' },
    { slug: 'asthma-bts-sign-vs-nice-guideline-comparison', publishedAt: '2026-09-12T09:00:00Z' },
    { slug: 'high-risk-medicines-monitoring-guidelines', publishedAt: '2026-08-28T09:00:00Z' },
    { slug: 'evaluating-pharmacy-revision-tools-methodology-guide', publishedAt: '2026-09-01T09:00:00Z' },
    { slug: 'oriel-pharmacy-sjt-foundation-training-guide', publishedAt: '2026-08-20T09:00:00Z' },
  ];

  let blogSlugs = fallbackBlogPosts
    .filter(p => !p.publishedAt || new Date(p.publishedAt) <= now)
    .map(p => p.slug);

  try {
    const API_URL = import.meta.env.PUBLIC_API_URL || 'https://api.acepharmexams.co.uk';
    const res = await fetch(`${API_URL}/api/v1/blog`);
    if (res.ok) {
      const data = await res.json();
      if (data.posts && data.posts.length > 0) {
        blogSlugs = data.posts
          .filter((p: any) => !p.publishedAt || new Date(p.publishedAt) <= now)
          .map((p: any) => p.slug);
      }
    }
  } catch {
    // Use filtered fallback static slugs
  }

  const sitemapEntries = [
    ...STATIC_PAGES.map((page) => `
  <url>
    <loc>${SITE_URL}${page}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${page === '' ? 'daily' : 'weekly'}</changefreq>
    <priority>${page === '' ? '1.0' : '0.8'}</priority>
  </url>`),
    ...blogSlugs.map((slug) => `
  <url>
    <loc>${SITE_URL}/blog/${slug}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`),
  ];

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries.join('')}
</urlset>`;

  return new Response(sitemapXml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
