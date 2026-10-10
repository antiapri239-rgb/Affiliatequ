import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import tailwind from '@astrojs/tailwind';

const site = process.env.SITE_URL
  ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`);

export default defineConfig({
  site,
  integrations: [tailwind(), mdx()],
  server: {
    host: true,
  },
});
