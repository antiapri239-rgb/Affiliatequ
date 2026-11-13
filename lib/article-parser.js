// lib/article-parser.js
// Baca artikel dari src/content/blog/*.md, parse frontmatter pakai js-yaml.
// Menggunakan import.meta.glob agar kompatibel dengan Vercel Serverless.

import { load as yamlLoad } from 'js-yaml';

const SITE_URL = 'https://rianticare.com';

// Astro: Ambil semua file .md & .mdx sebagai raw string saat build time
const allArticles = import.meta.glob('../src/content/blog/*.{md,mdx}', { query: '?raw', import: 'default', eager: true });

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};

  try {
    const parsed = yamlLoad(match[1]);
    return parsed || {};
  } catch (e) {
    console.warn('[article-parser] YAML parse error:', e.message);
    return {};
  }
}

export async function listArticles(opts) {
  const skipDrafts = (opts && opts.skipDrafts) !== false;
  const articles = [];

  for (const [filePath, rawContent] of Object.entries(allArticles)) {
    const file = filePath.split('/').pop();
    if (!file.endsWith('.md') && !file.endsWith('.mdx')) continue;

    try {
      const fm = parseFrontmatter(rawContent);

      if (skipDrafts && fm.draft === true) continue;

      const slug = file.replace(/\.(md|mdx)$/, '');
      const heroImage = fm.heroImage || '';
      const heroImageAbsolute = heroImage.startsWith('http')
        ? heroImage
        : SITE_URL + heroImage;

      articles.push({
        slug,
        filename: file,
        title: fm.title || slug,
        description: fm.description || '',
        pubDate: fm.pubDate ? String(fm.pubDate) : '',
        heroImage: heroImageAbsolute,
        heroImageRaw: heroImage,
        category: (fm.advanced && fm.advanced.category) || fm.category || 'Umum',
        productIds: (fm.advanced && fm.advanced.productIds) || [],
        draft: fm.draft === true,
        articleUrl: SITE_URL + '/blog/' + slug,
      });
    } catch (e) {
      console.warn('[article-parser] Gagal parse ' + file + ':', e.message);
    }
  }

  return articles.sort((a, b) => (b.pubDate || '').localeCompare(a.pubDate || ''));
}

export async function getArticle(slug) {
  const articles = await listArticles({ skipDrafts: false });
  return articles.find(a => a.slug === slug) || null;
}
