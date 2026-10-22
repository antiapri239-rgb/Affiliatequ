import fs from 'node:fs';
import path from 'node:path';
import { visit } from 'unist-util-visit';

export default function rehypeProductCards() {
  // Baca semua data produk sekali saat build
  const dir = path.join(process.cwd(), 'src', 'data', 'products');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
  const products = files.map(f => {
    const data = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    return {
      ...data,
      slug: path.basename(f, '.json'),
    };
  });

  return (tree) => {
    visit(tree, 'text', (node, index, parent) => {
      if (!node.value.includes('[PRODUK:')) return;

      const regex = /\[PRODUK:([^\]]+)\]/g;
      const newValue = node.value.replace(regex, (match, id) => {
        const norm = id.toLowerCase().replace(/[^a-z0-9]/g, '');
        const product = products.find(p => 
          (p.id && p.id.toLowerCase().replace(/[^a-z0-9]/g, '') === norm) ||
          (p.slug && p.slug.toLowerCase().replace(/[^a-z0-9]/g, '') === norm) ||
          (p.title && p.title.toLowerCase().replace(/[^a-z0-9]/g, '').includes(norm))
        );

        if (!product) return match;

        const imageUrl = product.gambar || product.image || '/images/default-product.jpg';
        const shopeeUrl = product.link_shopee || product.linkShopee || '#';

        return `
          <div class="product-card-auto" style="text-align:center; margin:30px 0; padding:20px; background:#fff; border-radius:12px; box-shadow:0 4px 6px rgba(0,0,0,0.05); border:1px solid #f0f0f0; max-width:300px; margin-left:auto; margin-right:auto;">
            <img src="${imageUrl}" alt="${product.title}" style="max-width:180px; height:auto; border-radius:8px; margin-bottom:15px;" loading="lazy" />
            <br/>
            <a href="${shopeeUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block; background-color:#ee4d2d; color:white; padding:10px 24px; border-radius:8px; text-decoration:none; font-weight:bold; font-size:14px;">
              🛒 Beli di Shopee
            </a>
          </div>
        `;
      });

      // Ganti text node dengan HTML string (pake 'raw' biar di-render sebagai HTML)
      parent.children[index] = {
        type: 'raw',
        value: newValue,
      };
    });
  };
}
