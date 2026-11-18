const fs = require("fs");

const pages = [
  "src/pages/index.astro",
  "src/pages/about.astro",
  "src/pages/contact.astro",
  "src/pages/privacy-policy.astro",
  "src/pages/dashboard-link.astro",
  "src/pages/blog/index.astro",
  "src/pages/blog/[slug].astro",
  "src/pages/produk/[id].astro",
];

const marker = '<meta charset="UTF-8" />';
const fontHref =
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap";
const block = [
  marker,
  '    <link rel="preconnect" href="https://fonts.googleapis.com" />',
  '    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />',
  '    <link rel="stylesheet" href="' + fontHref + '" />',
].join("\n");

for (const f of pages) {
  if (!fs.existsSync(f)) {
    console.log("TIDAK ADA:", f);
    continue;
  }
  const t = fs.readFileSync(f, "utf8");
  if (t.includes("fonts.googleapis.com")) {
    console.log("SUDAH ADA:", f);
    continue;
  }
  if (!t.includes(marker)) {
    console.log("GAGAL (meta charset tidak ditemukan):", f);
    continue;
  }
  fs.writeFileSync(f, t.replace(marker, () => block));
  console.log("OK:", f);
}

const css = "src/styles/global.css";
const lines = fs.readFileSync(css, "utf8").split("\n");
const kept = lines.filter((l) => !l.includes("fonts.googleapis.com"));
if (kept.length === lines.length) {
  console.log("CSS: baris @import tidak ditemukan");
} else {
  fs.writeFileSync(css, kept.join("\n"));
  console.log("OK: @import font dihapus dari", css);
}
