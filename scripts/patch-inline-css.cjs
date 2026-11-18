const fs = require("fs");
const f = "astro.config.mjs";
let t = fs.readFileSync(f, "utf8");
const a = "  site,\n";
if (t.includes("inlineStylesheets")) {
  console.log("SUDAH ADA: opsi inlineStylesheets, file tidak diubah");
  process.exit(0);
}
if (!t.includes(a)) {
  console.log("GAGAL: teks '  site,' tidak ditemukan, file tidak diubah");
  process.exit(1);
}
t = t.replace(a, () => a + "  build: {\n    inlineStylesheets: 'always',\n  },\n");
fs.writeFileSync(f, t);
console.log("OK: astro.config.mjs sudah diubah");
