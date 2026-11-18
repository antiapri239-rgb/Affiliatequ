const fs = require("fs");
const f = "src/pages/index.astro";
let t = fs.readFileSync(f, "utf8");
const fm = fs.readFileSync("/tmp/fm.txt", "utf8").replace(/\n$/, "");
const articles = fs.readFileSync("/tmp/articles.txt", "utf8");
const heading = fs.readFileSync("/tmp/heading.txt", "utf8").replace(/\n$/, "");

const a1 = "import '../styles/global.css';\n---";
const a2 = '      <section id="katalog"';
const a3 = '        <div class="mt-2 grid grid-cols-2 gap-x-3 gap-y-7 sm:gap-x-5 sm:gap-y-9 lg:grid-cols-3 xl:grid-cols-4">';
const a4 = "{products.map((product, i) => <ProductCard product={product} priority={i < 2} />)}";

if (t.includes("latestPosts")) {
  console.log("SUDAH ADA: bagian artikel sudah dipasang, file tidak diubah");
  process.exit(0);
}
let ok = true;
for (const a of [a1, a2, a3, a4]) {
  if (t.split(a).length !== 2) { console.log("GAGAL, titik sisip tidak ditemukan tepat 1x:", a.slice(0, 60)); ok = false; }
}
if (!ok) { console.log("Tidak ada file yang diubah."); process.exit(1); }

t = t.replace(a1, () => fm);
t = t.replace(a2, () => articles + a2);
t = t.replace(a3, () => heading);
t = t.replace(a4, () => "{products.map((product) => <ProductCard product={product} />)}");
fs.writeFileSync(f, t);
console.log("OK: index.astro sudah diubah");
