import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import tailwind from '@astrojs/tailwind';
import rehypeRaw from 'rehype-raw';
import rehypeProductCards from './src/plugins/rehype-product-cards.mjs';

import sitemap from '@astrojs/sitemap';

const site = 'https://www.rianticare.com';

export default defineConfig({
  markdown: {
    rehypePlugins: [rehypeRaw, rehypeProductCards],
  },
  site,
  integrations: [tailwind(), mdx(), sitemap()],
  server: {
    host: true,
  },
});