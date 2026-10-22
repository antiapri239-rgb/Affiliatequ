export function buildUserPrompt({ title, category, targetProducts = [], availableProducts = [] }) {
  const catalogContext = availableProducts.length
    ? `Konteks Katalog: Kamu HANYA boleh merekomendasikan produk dari daftar berikut: ${availableProducts.map(p => p.title).join(', ')}. JANGAN mengarang merek lain di luar daftar ini.`
    : 'Karena tidak ada produk spesifik yang diberikan, tulis artikel secara umum tanpa menyebut merek tertentu.';

  const hasTargets = targetProducts.length > 0;

  const productContext = hasTargets
    ? `Produk yang WAJIB dibahas (gunakan sebagai fakta utama):\n${targetProducts
        .map((p, i) => `${i + 1}. ${p.title} | id: ${p.id} | ${p.description || ''}`)
        .join('\n')}`
    : '';

  const markerRule = hasTargets
    ? `\n\nATURAN PENANDA PRODUK (WAJIB, tidak boleh dihilangkan demi keringkasan):
- Untuk SETIAP produk di atas, tulis penanda di baris sendiri, TEPAT SETELAH paragraf yang membahas produk itu.
- Format persis: [PRODUK:id] dengan id sama persis seperti di daftar. Id yang valid hanya: ${targetProducts.map(p => p.id).join(', ')}.
- Tiap id muncul tepat SATU kali. Tanpa bold, tanpa kutip, tanpa backtick, jangan taruh di tengah kalimat.
- Jangan mengarang id lain.`
    : '';

  return `Buat artikel blog berdasarkan informasi berikut.\n\nJudul: ${title}\nKategori: ${category}\n\n${productContext}\n${hasTargets ? 'Bahas HANYA produk yang tercantum di atas. Jangan menambahkan produk atau merek lain.' : catalogContext}\n\nKembalikan hanya JSON valid dengan format: {"article": "...", "description": "...", "tags": ["..."]}. Pastikan article dan description berupa string, tags berupa array string, dan jangan tambahkan teks di luar JSON.${markerRule}`;
}
