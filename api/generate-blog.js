import fs from 'node:fs/promises';
import path from 'node:path';
import { generateArticle } from '../lib/ai-provider.js';

export const maxDuration = 60;

const MAX_TITLE_LENGTH = 200;
const MAX_CATEGORY_LENGTH = 100;

async function getProductsByIds(productIds) {
  if (!Array.isArray(productIds) || productIds.length === 0) return [];
  const dir = path.join(process.cwd(), 'src', 'data', 'products');
  const fileNames = (await fs.readdir(dir)).filter(f => f.toLowerCase().endsWith('.json'));
  const all = (await Promise.all(fileNames.map(async f => {
    try {
      return {
        slug: path.basename(f, '.json'),
        data: JSON.parse(await fs.readFile(path.join(dir, f), 'utf8')),
      };
    } catch {
      return null;
    }
  }))).filter(Boolean);

  const products = [];
  for (const wanted of productIds) {
    const hit = all.find(x => x.slug === wanted || x.data.id === wanted);
    if (hit) products.push(hit.data);
    else console.warn(`Product ${wanted} not found.`);
  }
  return products;
}

async function getProductsByCategory(category) {
  const productsDirectory = path.join(process.cwd(), 'src', 'data', 'products');
  const fileNames = (await fs.readdir(productsDirectory))
    .filter(fileName => fileName.toLowerCase().endsWith('.json'))
    .sort();
  const products = [];

  for (const fileName of fileNames) {
    const filePath = path.join(productsDirectory, fileName);
    let product;
    try {
      product = JSON.parse(await fs.readFile(filePath, 'utf8'));
    } catch (error) {
      throw new Error(`Unable to read product file ${fileName}`, { cause: error });
    }

    if (!product || typeof product !== 'object' || Array.isArray(product)) {
      throw new Error(`Product file ${fileName} must contain a JSON object`);
    }

    if (String(product.category).toLowerCase() !== String(category).toLowerCase()) continue;
    if (typeof product.id !== 'string' || typeof product.title !== 'string') {
      throw new Error(`Product file ${fileName} is missing a valid id or title`);
    }

    products.push({ id: product.id, title: product.title });
    if (products.length === 10) break;
  }

  return products;
}

async function getExistingArticles() {
  const articlesDirectory = path.join(process.cwd(), 'src', 'content', 'blog');
  const fileNames = (await fs.readdir(articlesDirectory))
    .filter(fileName => fileName.toLowerCase().endsWith('.md'))
    .sort();

  return Promise.all(fileNames.map(async fileName => {
    const filePath = path.join(articlesDirectory, fileName);
    const content = await fs.readFile(filePath, 'utf8');
    const frontmatter = content.match(/^---\s*\r?\n([\s\S]*?)\r?\n---(?:\s|$)/);
    const titleLine = frontmatter?.[1].match(/^title:\s*(.*?)\s*$/m);
    let title = titleLine?.[1] || '';

    if (
      (title.startsWith('"') && title.endsWith('"'))
      || (title.startsWith("'") && title.endsWith("'"))
    ) {
      title = title.slice(1, -1);
    }

    return title || path.basename(fileName, path.extname(fileName));
  }));
}

function hasAnyProviderConfigured() {
  const order = (process.env.AI_PROVIDER_ORDER || process.env.AI_PROVIDER || 'gemini,groq')
    .split(',')
    .map(name => name.trim())
    .filter(Boolean);

  for (const name of order) {
    if (name === 'gemini' && process.env.GEMINI_API_KEY) return true;
    if (name === 'groq' && process.env.GROQ_API_KEY) return true;
  }
  return false;
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Method not allowed' });
  }

  if (process.env.ENABLE_AI_GENERATOR !== 'true') {
    return response.status(403).json({ error: 'AI article generation is disabled' });
  }

  const body = request.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return response.status(400).json({ error: 'A JSON object is required' });
  }

  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const category = typeof body.category === 'string' ? body.category.trim() : '';
  const productIds = Array.isArray(body.productIds)
    ? body.productIds.filter(id => typeof id === 'string').slice(0, 10)
    : [];

  if (!title || !category) {
    return response.status(400).json({ error: 'Title and category are required' });
  }
  if (title.length > MAX_TITLE_LENGTH || category.length > MAX_CATEGORY_LENGTH) {
    return response.status(400).json({ error: 'Title or category is too long' });
  }

  if (!hasAnyProviderConfigured()) {
    return response.status(503).json({ error: 'AI generation is not configured' });
  }

  response.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
  response.setHeader('Cache-Control', 'no-cache, no-transform');
  response.setHeader('X-Content-Type-Options', 'nosniff');

  const sendEvent = event => response.write(`${JSON.stringify(event)}\n`);
  response.flushHeaders?.();

  try {
    const [availableProducts, existingArticles, targetProducts] = await Promise.all([
      getProductsByCategory(category),
      getExistingArticles(),
      getProductsByIds(productIds),
    ]);
    const generated = await generateArticle({
      title,
      category,
      targetProducts,
      availableProducts,
      existingArticles,
      onArticleChunk: text => sendEvent({ type: 'article', text }),
    });
    sendEvent({
      type: 'metadata',
      description: generated.description,
      tags: generated.tags,
    });
    sendEvent({ type: 'done' });
    return response.end();
  } catch (error) {
    console.error('AI article generation failed:', error);
    sendEvent({
      type: 'error',
      error: error instanceof Error ? error.message : 'Unable to generate the article right now',
    });
    return response.end();
  }
}
