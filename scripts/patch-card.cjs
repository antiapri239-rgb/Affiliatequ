const fs = require("fs");
const f = "src/components/ProductCard.astro";
let t = fs.readFileSync(f, "utf8");
const a = "const { product } = Astro.props;";
const b = "src={product.image}";
if (!t.includes(a) || !t.includes(b)) {
  console.log("GAGAL: teks tidak ditemukan, file tidak diubah");
  process.exit(1);
}
const helper = [
  "const { product } = Astro.props;",
  "",
  "const optimizedImage = (url: string) => {",
  "  if (!url.includes('susercontent.com') || url.endsWith('_tn')) return url;",
  "  const base = url.replace(/@resize_w\\d+_nl\\.webp$/, '').replace(/\\.webp$/, '');",
  "  return base + '@resize_w450_nl.webp';",
  "};",
].join("\n");
t = t.replace(a, () => helper).replace(b, () => "src={optimizedImage(product.image)}");
fs.writeFileSync(f, t);
console.log("OK: ProductCard.astro sudah diubah");
