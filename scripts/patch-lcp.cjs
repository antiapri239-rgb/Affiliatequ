const fs = require("fs");

const card = "src/components/ProductCard.astro";
const home = "src/pages/index.astro";
let c = fs.readFileSync(card, "utf8");
let h = fs.readFileSync(home, "utf8");

const cardEdits = [
  ["  product: Product;", "  product: Product;\n  priority?: boolean;"],
  ["const { product } = Astro.props;", "const { product, priority = false } = Astro.props;"],
  ['loading="lazy"', "loading={priority ? 'eager' : 'lazy'}\n        fetchpriority={priority ? 'high' : undefined}"],
];
const homeEdit = [
  "{products.map((product) => <ProductCard product={product} />)}",
  "{products.map((product, i) => <ProductCard product={product} priority={i < 2} />)}",
];

let ok = true;
for (const [a] of cardEdits) {
  if (!c.includes(a)) { console.log("GAGAL di ProductCard, tidak ketemu:", a); ok = false; }
}
if (!h.includes(homeEdit[0])) { console.log("GAGAL di index.astro, tidak ketemu:", homeEdit[0]); ok = false; }
if (!ok) { console.log("Tidak ada file yang diubah."); process.exit(1); }

for (const [a, b] of cardEdits) c = c.replace(a, () => b);
h = h.replace(homeEdit[0], () => homeEdit[1]);
fs.writeFileSync(card, c);
fs.writeFileSync(home, h);
console.log("OK: ProductCard.astro dan index.astro sudah diubah");
