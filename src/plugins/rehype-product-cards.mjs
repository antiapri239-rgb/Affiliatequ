import fs from 'node:fs';
import path from 'node:path';
import { visit, SKIP } from 'unist-util-visit';

const esc = s => String(s ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const norm = s => String(s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');

export default function rehypeProductCards() {
  // Baca semua data produk sekali saat build
  const dir = path.join(process.cwd(), 'src', 'data', 'products');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
  const products = files.map(f => {
    const data = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    return { ...data, slug: path.basename(f, '.json') };
  });

  function findProduct(id) {
    const key = norm(id);
    if (!key) return null;
    return (
      products.find(p => norm(p.id) === key) ||
      products.find(p => norm(p.slug) === key) ||
      products.find(p => key.length >= 6 && norm(p.title).includes(key)) ||
      null
    );
  }

  function cardHtml(product) {
    const imageUrl = product.image || product.gambar || '/images/default-product.jpg';
    const shopeeUrl = product.shopeeUrl || product.link_shopee || product.linkShopee || '#';
    const title = esc(product.title);
    const link = esc(shopeeUrl);
    return [
      '<div class="product-card-auto not-prose" style="margin:24px auto;width:100%;max-width:320px;background:#fff;border:1px solid #eee;border-radius:14px;box-shadow:0 2px 10px rgba(0,0,0,0.06);overflow:hidden;">',
      `<a href="${link}" target="_blank" rel="noopener noreferrer nofollow sponsored" style="display:block;">`,
      `<img src="${esc(imageUrl)}" alt="${title}" loading="lazy" style="display:block;width:100%;aspect-ratio:1/1;object-fit:cover;margin:0;border-radius:0;" />`,
      '</a>',
      '<div style="padding:14px 16px 16px;text-align:center;">',
      `<p style="margin:0 0 12px;font-size:14px;font-weight:600;line-height:1.4;color:#1c1917;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${title}</p>`,
      `<a href="${link}" target="_blank" rel="noopener noreferrer nofollow sponsored" style="display:block;background:#ee4d2d;color:#fff;padding:12px 16px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;">🛒 Beli di Shopee</a>`,
      '</div>',
      '</div>',
    ].join('');
  }

  return (tree) => {
    // 1. Paragraf yang isinya HANYA penanda: ganti seluruh paragrafnya (tanpa <p> kosong tersisa)
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'p' || !parent || index == null) return;
      if (node.children.length !== 1 || node.children[0].type !== 'text') return;
      const match = node.children[0].value.match(/^\s*\[PRODUK:([^\]]+)\]\s*$/);
      if (!match) return;
      const product = findProduct(match[1]);
      if (!product) return;
      parent.children[index] = { type: 'raw', value: cardHtml(product) };
      return SKIP;
    });

    // 2. Penanda di tengah teks (cadangan)
    visit(tree, 'text', (node, index, parent) => {
      if (!parent || index == null || !node.value.includes('[PRODUK:')) return;
      const newValue = node.value.replace(/\[PRODUK:([^\]]+)\]/g, (whole, id) => {
        const product = findProduct(id);
        return product ? cardHtml(product) : whole;
      });
      if (newValue === node.value) return;
      parent.children[index] = { type: 'raw', value: newValue };
    });
  };
}
