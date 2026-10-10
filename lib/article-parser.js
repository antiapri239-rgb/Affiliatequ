// lib/article-parser.js
// Baca artikel dari src/content/blog/*.md, parse frontmatter pakai js-yaml.

import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { load as yamlLoad } from 'js-yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BLOG_DIR = join(__dirname, '..', 'src', 'content', 'blog');
const SITE_URL = 'https://alfeto.vercel.app';

/**
 * Parse YAML frontmatter pakai js-yaml (robust).
 */
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

/**
 * Baca semua artikel blog.
 * @param {Object} opts - { skipDrafts: true }
 * @returns {Promise<Array>}
 */
export async function listArticles(opts) {
  const skipDrafts = (opts && opts.skipDrafts) !== false;

  let files;
  try {
    files = await readdir(BLOG_DIR);
  } catch (e) {
    console.warn('[article-parser] Blog dir nggak ada:', e.message);
    return [];
  }

  const articles = [];

  for (const file of files) {
    if (!file.endsWith('.md') && !file.endsWith('.mdx')) continue;

    try {
      const fullPath = join(BLOG_DIR, file);
      const raw = await readFile(fullPath, 'utf-8');
      const fm = parseFrontmatter(raw);

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

/**
 * Baca 1 artikel by slug.
 */
export async function getArticle(slug) {
  const articles = await listArticles({ skipDrafts: false });
  return articles.find(a => a.slug === slug) || null;
}
