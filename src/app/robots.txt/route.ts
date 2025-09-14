import { NextResponse } from 'next/server';

export async function GET() {
  const robotsTxt = `User-agent: *
Allow: /

# Sitemaps
Sitemap: https://shop.agrikoph.com/sitemap.xml

# Disallow admin/sensitive areas  
Disallow: /admin/
Disallow: /wp-admin/
Disallow: /api/
Disallow: /_next/
Disallow: /test-*

# Allow important SEO files
Allow: /sitemap.xml
Allow: /*.css$
Allow: /*.js$
Allow: /images/
Allow: /favicon.ico

# Crawl delay
Crawl-delay: 1`;

  return new NextResponse(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}