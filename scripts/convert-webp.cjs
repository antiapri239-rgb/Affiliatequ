const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
}

(async () => {
  const files = walk("public/images").filter((f) => /\.(jpe?g|png)$/i.test(f));
  for (const f of files) {
    const out = f.replace(/\.(jpe?g|png)$/i, ".webp");
    if (fs.existsSync(out)) {
      console.log("SKIP (sudah ada):", out);
      continue;
    }
    await sharp(f).webp({ quality: 82 }).toFile(out);
    const a = (fs.statSync(f).size / 1024).toFixed(0);
    const b = (fs.statSync(out).size / 1024).toFixed(0);
    console.log("OK:", f, a + "KB ->", b + "KB");
  }
  console.log("Selesai:", files.length, "file diproses");
})();
