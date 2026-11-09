import type { APIRoute } from 'astro';
import { site } from '../config';

export const GET: APIRoute = () => {
  const allow = site.seo.robots === 'index';
  const body = [`User-agent: *`, allow ? 'Allow: /' : 'Disallow: /', '', `Sitemap: ${new URL('/sitemap-index.xml', site.seo.siteUrl)}`].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain' } });
};
