import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import tailwind from '@astrojs/tailwind';
import rehypeRaw from 'rehype-raw';
import rehypeProductCards from './src/plugins/rehype-product-cards.mjs';

const site = process.env.SITE_URL
  ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`);

export default defineConfig({
  markdown: {
    rehypePlugins: [rehypeRaw, rehypeProductCards],
  },
  site,
  integrations: [tailwind(), mdx()],
  server: {
    host: true,
  },
});
