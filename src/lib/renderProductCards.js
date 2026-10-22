import fs from 'node:fs';
import path from 'node:path';

// Fungsi buat narik semua data produk dari folder JSON
function getAllProducts() {
  const dir = path.join(process.cwd(), 'src', 'data', 'products');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
  
  return files.map(f => {
    const data = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    return {
      ...data,
      slug: path.basename(f, '.json'),
      // Normalisasi ID biar case-insensitive
      _normId: String(data.id || '').toLowerCase().replace(/[^a-z0-9]/g, ''),
      _normSlug: path.basename(f, '.json').toLowerCase().replace(/[^a-z0-9]/g, '')
    };
  });
}

export function renderProductCards(htmlContent) {
  const products = getAllProducts();

  // Regex buat nyari [PRODUK:...]
  const regex = /\[PRODUK:([^\]]+)\]/g;

  return htmlContent.replace(regex, (match, productId) => {
    const norm = productId.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // Cari produk yang cocok (case-insensitive)
    const product = products.find(p => 
      p._normId === norm || 
      p._normSlug === norm || 
      p._normId.includes(norm) || 
      p._normSlug.includes(norm)
    );

    if (!product) {
      console.warn(`⚠️ Produk tidak ditemukan: ${productId}`);
      return `<p style="color:red;">[Produk tidak ditemukan: ${productId}]</p>`;
    }

    // Ambil gambar & link Shopee
    const imageUrl = product.gambar || product.image || '/images/default-product.jpg';
    const shopeeUrl = product.link_shopee || product.linkShopee || '#';

    // Render HTML Card
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
}
