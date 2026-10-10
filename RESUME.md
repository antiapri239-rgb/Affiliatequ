# Resume Proyek Blog Rianti

**Last update:** 11 Oktober 2026
**Repo:** https://github.com/antiapri239-rgb/Affiliatequ
**Live:** https://rianti.vercel.app

---

## 🎯 Tentang Proyek

Blog affiliate skincare untuk audience wanita Indonesia. Traffic utama dari Pinterest. Model bisnis: review produk skincare → link affiliate Shopee → komisi.

- **Niche:** Skincare, beauty, self-care wanita Indonesia
- **Target:** Wanita 18-35 tahun, budget-aware, Pinterest-active
- **Monetisasi:** Shopee Affiliate + program brand langsung

---

## 🏗️ Tech Stack

| Layer | Teknologi |
|---|---|
| Framework | Astro v5.18.2 (static site) |
| Styling | Tailwind CSS |
| CMS | Decap CMS (Git-based, di `/admin/`) |
| Hosting | Vercel (auto-deploy dari GitHub) |
| OAuth Proxy | Cloudflare Worker (`rianti-cms-proxy`) |
| AI Provider | Google Gemini (`gemini-3.8-flash`) + Groq fallback |
| Content | Markdown (artikel) + JSON (produk & kategori) |
| Gambar | `public/images/` (upload via CMS) |
| Pin Generator | Custom HTML/JS (vanilla) |

**Repo asal:** `antiapri239-rgb/RIANTI-Affiliate` (Alfeto — template dekorasi, di-rebranding)

---

## 📁 Struktur Folder Penting

src/
├── components/
│ ├── Header.astro ← tagline "KURASI & INSPIRASI" (perlu diganti)
│ ├── Footer.astro ← ✅ udah skincare
│ ├── ProductCard.astro
│ └── ShopTheLook.astro
├── content/
│ └── blog/ ← artikel .md
├── data/
│ ├── categories.ts ← helper kategori
│ ├── category-options/ ← JSON kategori
│ │ ├── 01-cleanser.json
│ │ ├── 02-moisturizer.json
│ │ ├── 03-sunscreen.json
│ │ ├── 04-serum.json
│ │ └── 05-masker.json
│ ├── products/ ← JSON produk (kosong + .gitkeep)
│ └── products.ts ← helper produk
├── pages/
│ ├── index.astro ← homepage + katalog
│ ├── about.astro ← masih dekorasi (perlu diganti)
│ ├── contact.astro ← masih dekorasi
│ ├── privacy-policy.astro ← ✅ ada disclosure affiliate
│ ├── blog/
│ │ ├── index.astro
│ │ └── [slug].astro
│ └── produk/
│ └── [id].astro
└── content.config.ts

public/
├── admin/
│ ├── config.yml ← config Decap CMS
│ ├── index.html ← title "Rianti Blog CMS" + sidebar Pintasan
│ ├── generate-blog-widget.js
│ ├── pin-generator.html
│ ├── pinterest-dashboard.html
│ ├── product-preview.js
│ ├── settings.html
│ └── preview.css
└── images/
├── blog/
└── products/

api/
└── generate-blog.js ← Vercel Function AI

lib/
└── ai-provider.js ← abstraksi provider AI


---

## ✅ Yang UDAH Dilakuin

### Fase 1 — Setup Environment
- [x] Install Node.js v24.21.0
- [x] Install Git 2.56.0
- [x] Setup PowerShell execution policy `RemoteSigned`
- [x] Clone repo `RIANTI-Affiliate` (template Alfeto)
- [x] `npm install` — sukses
- [x] Build lokal `npm run build` — sukses

### Fase 2 — Rebranding (Alfeto → Rianti)
- [x] Ganti "Alfeto" → "Rianti" (12 file)
- [x] Hero: "Inspirasi Skincare untuk Kulit Sehat & Glowing"
- [x] Deskripsi: "Kurasi produk skincare, tips perawatan kulit..."
- [x] Meta title & og:title
- [x] Footer skincare
- [x] Tombol "Katalog Dekorasi" → "Katalog Skincare"

### Fase 3 — Deploy & Subdomain
- [x] Push ke GitHub: `antiapri239-rgb/Affiliatequ`
- [x] Deploy Vercel (auto-deploy)
- [x] Rename project Vercel `affiliatequ` → `rianti`
- [x] Subdomain `rianti.vercel.app`
- [x] Fix build cache error (redeploy clear cache)

### Fase 4 — CMS OAuth
- [x] Bikin GitHub OAuth App "Rianti CMS"
- [x] Cloudflare Worker `rianti-cms-proxy`
- [x] Set secrets OAuth di Worker
- [x] Setup callback URL di GitHub
- [x] Test login CMS — sukses

### Fase 5 — Kategori Skincare
- [x] Hapus 5 kategori dekorasi lama
- [x] Bikin 5 kategori skincare: `cleanser`, `moisturizer`, `sunscreen`, `serum`, `masker`
- [x] Fix format JSON pakai field `title` (bukan `name`)

### Fase 6 — Bersihkan Konten Lama
- [x] Hapus semua produk dekorasi
- [x] Hapus 3 artikel dekorasi
- [x] Bikin folder `src/data/products/` + `.gitkeep`

### Fase 7 — AI Generator
- [x] Set env var Vercel: `GEMINI_API_KEY`, `GROQ_API_KEY`, `ENABLE_AI_GENERATOR=true`
- [x] Test generate artikel AI — sukses
- [x] Artikel pertama published: "Rutinitas Skincare 3 Langkah untuk Kulit Berminyak"

### Fase 8 — Pin Generator
- [x] Fix branding "Alfeto" → "Rianti" di semua file admin
- [x] Fix link artikel di CSV Pin Generator
- [x] Pin Generator jalan (6 template: Warm, Poster, Typography, Bold Type, Listicle, Before/After)

---

## ⚠️ Known Issues / Belum Selesai

### Issue 1 — Tagline Header "KURASI & INSPIRASI"
- **Lokasi:** `src/components/Header.astro`
- **Fix:** Ganti ke "SKINCARE & GLOW" atau sejenisnya

### Issue 2 — Halaman About/Contact Masih Dekorasi
- **Lokasi:** `src/pages/about.astro`, `src/pages/contact.astro`
- **Fix:** Rewrite jadi konten skincare

### Issue 3 — Author "Alfeto" di Artikel
- **Lokasi:** `src/content.config.ts` atau frontmatter artikel
- **Fix:** Ganti ke "Rianti"

### Issue 4 — URL Gambar `alfeto.vercel.app` di Pin Generator
- **Status:** kemungkinan cache browser
- **Fix:** Hard refresh / clear cache

### Issue 5 — Identifier Internal "alfeto" (JANGAN DIGANTI)
- `settings.html:162` → `TOKEN_KEY = 'alfeto_ai_settings'`
- `generate-blog-widget.js:5` → `metadataEventName = 'alfeto:generate'`

---

## 🚀 Rencana ke Depan

### Prioritas 1 — Konten (Minggu ini)
- [ ] Ganti tagline header
- [ ] Rewrite About & Contact page
- [ ] Ganti author artikel ke "Rianti"
- [ ] Tulis 5-10 artikel pakai AI:
  - [ ] "5 Moisturizer di Bawah 100rb yang Worth It"
  - [ ] "Cara Pilih Sunscreen buat Kulit Sensitif"
  - [ ] "Skincare Routine untuk Mahasiswa Budget Terbatas"
  - [ ] "Body Care Routine buat Kulit Glowing"
  - [ ] "Perbedaan Niacinamide vs Vitamin C"

### Prioritas 2 — Produk & Affiliate
- [ ] Daftar Shopee Affiliate
- [ ] Tambah 10-15 produk skincare via CMS (Wardah, Emina, Azarine, Skintific, Somethinc, Avoskin, Hanasui, Scarlett)
- [ ] Ganti link Shopee biasa → link affiliate

### Prioritas 3 — Traffic Pinterest
- [ ] Setup Pinterest Business
- [ ] Verify domain `rianti.vercel.app`
- [ ] Generate 3 pin per artikel pakai Pin Generator
- [ ] Upload ke Pinterest
- [ ] Konsisten 5-10 pin/hari

### Prioritas 4 — Optimasi
- [ ] Gambar AI di dalam artikel (per H3) — butuh kode tambahan
- [ ] Google Analytics / Vercel Analytics
- [ ] Email capture (opsional)
- [ ] SEO on-page

### Prioritas 5 — Scale
- [ ] Custom domain (~Rp150rb/tahun)
- [ ] Auto-post Pinterest via API
- [ ] A/B testing template pin
- [ ] Analisis & scale

---

## 🔑 Informasi Penting

### Kredensial & Akses
- **GitHub:** `antiapri239-rgb`
- **Vercel Project:** `rianti`
- **Cloudflare Worker:** `rianti-cms-proxy.rianti.workers.dev`
- **CMS Login:** GitHub OAuth
- **CMS URL:** https://rianti.vercel.app/admin/

### Env Variables Vercel
| Key | Type | Environment |
|---|---|---|
| `GEMINI_API_KEY` | Secret | All |
| `GROQ_API_KEY` | Secret | All |
| `ENABLE_AI_GENERATOR` | Config (`true`) | All |

### Command Penting
```bash
# Lokal
npm run dev          # dev server
npm run build        # build produksi
npx vercel dev       # dev server + Vercel Function

# Git
git pull origin main --no-edit    # sync dengan CMS
git add . && git commit -m "..." && git push

# CMS
# https://rianti.vercel.app/admin/  → login GitHub

Deploy Workflow
Edit lokal ATAU via CMS

Push ke GitHub ATAU CMS auto-commit

Vercel auto-deploy (1-2 menit)

Cek di rianti.vercel.app

Kalau deploy error padahal build lokal sukses: → Redeploy Vercel dengan Clear Build Cache

📌 Catatan Khusus Developer/AI Berikutnya
1. Field Kategori HARUS title
json
{"id":"cleanser","title":"Cleanser"}
Bukan name. Config CMS & Astro expect title.

2. Collection Pintasan di CMS
Ada di config.yml (collection pintasan) + custom sidebar di index.html.
Kadang hilang saat navigasi — bug Decap CMS, bukan config salah.

3. AI Generator Butuh 3 Env Var
GEMINI_API_KEY — provider utama

GROQ_API_KEY — fallback

ENABLE_AI_GENERATOR=true — HARUS Config, BUKAN Secret

4. Pin Generator Ambil Data dari heroImage
Field heroImage di frontmatter artikel = URL gambar pin. Kalau kosong → gradient aja.

5. JANGAN Sentuh Identifier Internal
alfeto_ai_settings (settings.html)

alfeto:generate (generate-blog-widget.js)

6. JANGAN Commit .env.local
Buat test AI lokal → bikin .env.local → pastikan di .gitignore.

7. Format Tanggal
CMS pakai YYYY-MM-DD. Contoh: pubDate: 2026-10-11.

8. Draft & Jadwal Terbit
Artikel muncul di public HANYA KALAU:

draft: false

Tanggal terbit ≤ hari ini

Gak ada jadwal terbit masa depan

📞 Kalau Ada Masalah
Deploy gagal: Redeploy dengan clear cache Vercel

CMS gak login: Cek callback URL GitHub OAuth + Cloudflare Worker secret

AI gak jalan: Cek 3 env var Vercel

Kategori kosong: Cek JSON format — harus {"id":"...","title":"..."}

Artikel gak muncul: Cek draft: false & tanggal terbit

Gambar gak muncul: Cek heroImage path, upload ulang via CMS

Status: Blog live & fungsional, siap produksi konten 🚀


---

**Selesai.** Tinggal copy seluruh blok markdown di atas → paste ke Notepad → save sebagai `RESUME.md` → push.

**Push:**

```powershell
cd C:\Users\dell\Downloads\RIANTI-Affiliate-main
git add .
git commit -m "docs: tambah RESUME.md"
git push