import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

/**
 * The active preset (RESORT_PRESET) provides the canonical site URL.
 * Output is fully static — deploy dist/ to Cloudflare Pages, Vercel or any CDN.
 */
const preset = (process.env.RESORT_PRESET || 'coastal').trim();
const cfg = (await import(`./src/presets/${preset}/index.ts`)).default as { seo: { siteUrl: string; robots?: string } };

export default defineConfig({
  site: process.env.SITE_URL || (process.env.BASE_PATH ? 'https://aruanmf446-hub.github.io' : cfg.seo.siteUrl),
  base: process.env.BASE_PATH || '/',
  output: 'static',
  trailingSlash: 'ignore',
  build: { format: 'directory', inlineStylesheets: 'auto' },
  integrations: [sitemap({ filter: (page) => !page.includes('/404') })],
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
  vite: {
    build: { chunkSizeWarningLimit: 900 },
    ssr: { noExternal: ['gsap'] },
  },
  devToolbar: { enabled: false },
});
