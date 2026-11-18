const fs = require("fs");
const path = require("path");

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
}

const files = walk("src").filter((f) => /\.(md|mdx|json|ts|astro|mjs)$/.test(f));
let total = 0;
for (const f of files) {
  const text = fs.readFileSync(f, "utf8");
  const next = text.replace(/\/images\/[^\s"')]+\.(jpe?g|png)/gi, (m) => {
    const w = m.replace(/\.(jpe?g|png)$/i, ".webp");
    if (fs.existsSync(path.join("public", w))) {
      console.log("GANTI:", f, "\n   ", m, "->", w);
      total++;
      return w;
    }
    console.log("LEWAT (webp tidak ada):", f, m);
    return m;
  });
  if (next !== text) fs.writeFileSync(f, next);
}
console.log("Selesai:", total, "referensi diganti");
