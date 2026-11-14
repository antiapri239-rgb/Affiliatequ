export const prerender = false;
export const maxDuration = 60;

import fs from 'node:fs/promises';
import path from 'node:path';
import { generateArticle } from '../../../lib/ai-provider.js';
import { normalizeProductMarkers } from '../../../lib/prompt-helpers.js';

const MAX_TITLE_LENGTH = 200;
const MAX_CATEGORY_LENGTH = 100;

async function getProductsByIds(productIds) {
  if (!Array.isArray(productIds) || productIds.length === 0) return [];
  const dir = path.join(process.cwd(), 'src', 'data', 'products');
  const fileNames = (await fs.readdir(dir)).filter(f => f.toLowerCase().endsWith('.json'));
  const all = (await Promise.all(fileNames.map(async f => {
    try { return { slug: path.basename(f, '.json'), data: JSON.parse(await fs.readFile(path.join(dir, f), 'utf8')) }; }
    catch { return null; }
  }))).filter(Boolean);

  const products = [];
  for (const wanted of productIds) {
    const hit = all.find(x => x.slug === wanted || x.data.id === wanted);
    if (hit) products.push(hit.data);
    else console.warn(`[generate-blog] Produk ID "${wanted}" tidak ditemukan.`);
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
    try { product = JSON.parse(await fs.readFile(filePath, 'utf8')); }
    catch (error) { throw new Error(`Unable to read ${fileName}`, { cause: error }); }
    if (!product || typeof product !== 'object' || Array.isArray(product)) throw new Error(`File ${fileName} must be object`);
    if (String(product.category).toLowerCase() !== String(category).toLowerCase()) continue;
    if (typeof product.id !== 'string' || typeof product.title !== 'string') throw new Error(`File ${fileName} missing id/title`);
    products.push(product);
  }
  return products;
}

export const ALL = async ({ request }) => {
  const body = await request.json().catch(() => ({}));

  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const category = typeof body.category === 'string' ? body.category.trim() : '';
  const productIds = Array.isArray(body.productIds) ? body.productIds.filter(id => typeof id === 'string').slice(0, 10) : [];

  if (!title) return new Response(JSON.stringify({ error: 'Judul wajib diisi' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  if (title.length > MAX_TITLE_LENGTH || category.length > MAX_CATEGORY_LENGTH) {
    return new Response(JSON.stringify({ error: 'Judul atau kategori terlalu panjang' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    let products = [];
    if (productIds.length > 0) {
      products = await getProductsByIds(productIds);
    } else if (category) {
      products = await getProductsByCategory(category);
    }

    console.log(`[generate-blog] Title: "${title}" | Category: "${category}" | Products found: ${products.length}`);
    if (products.length > 0) {
      console.log(`[generate-blog] Produk:`, products.map(p => p.title).join(', '));
    }

    const article = await generateArticle({ title, category, targetProducts: products, availableProducts: products });
    
    // Log isi mentah AI buat debugging
    
    const content = normalizeProductMarkers(article.article, products);
    const description = article.description || '';
    const tags = article.tags || [];

    // --- FORMAT JSON PER BARIS ---
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(JSON.stringify({ type: 'article', text: content }) + '\n'));
        controller.enqueue(encoder.encode(JSON.stringify({ type: 'metadata', description: description, tags: tags }) + '\n'));
        controller.enqueue(encoder.encode(JSON.stringify({ type: 'done' }) + '\n'));
        controller.close();
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no',
      },
    });

  } catch (error) {
    console.error('[generate-blog] Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Gagal generate artikel' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
