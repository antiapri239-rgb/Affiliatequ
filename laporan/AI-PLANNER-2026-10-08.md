# AI Planner & Pin Generator — 8 Oktober 2026

**Repo:** /home/alto/Katalog-Affiliate
**Branch:** main
**Commit terakhir:** 73197ea — Add 3 new styles: pastel, boho, poster (7 styles total)
**Status:** 7 style live di production (alfeto.vercel.app)

## Ringkasan Hari Ini

Fokus: implementasi AI Planner untuk Pin Generator, integrasi ke form artikel, dan penambahan style baru.

Hasil akhir: Pin Generator otomatis generate 7 style berbeda dari judul artikel, dengan CTA naratif natural dan palet warna variatif.

## Fitur yang Selesai

### 1. AI Planner (Baru)
- File: lib/ai-planner.js
- Cascade: Groq (Tier 1) -> Gemini (Tier 2) -> preset fallback
- AI analisa judul + kategori -> tentukan layout, palette, CTA
- Output JSON -> di-compose jadi JSX Satori

### 2. 35 Palet Warna (Baru)
- File: lib/pin-templates/_shared/palettes.js
- Kategori: warm, cool, nature, pastel, dark, vibrant, neutral
- AI pilih nama palet, compose resolve ke hex

### 3. CTA Naratif Natural
- AI parafrase judul + action ("lanjut baca yuk")
- Format: "[narasi], [action]" — tanpa sapaan
- Contoh: "Cara pasang rak kayu minimalis, lanjut baca yuk"

### 4. Font Baru
- Plus Jakarta Sans (Regular, SemiBold, Bold)
- Fraunces Italic (untuk aksen)
- File: lib/fonts/

### 5. Layout Beda Per Style
- 4 style distinct: minimalis (putih), bold (hitam), editorial (krem), warm (cokelat)
- 3 style baru: pastel, boho, poster

### 6. 3 Style Baru
| Style | Karakter |
|---|---|
| pastel | Putih + aksen pink/lavender |
| boho | Tanah + cokelat (earth tone) |
| poster | Teks gede nutup 2/3 atas, tegas |

### 7. Integrasi ke Form Artikel Decap
- Field pinCta di config.yml (opsional override)
- prefillFromQuery() di pin-generator.html
- URL: /admin/pin-generator.html?title=...&category=...&image=...&cta=...
- Form auto-isi dari query param

### 8. Fix Vercel Limit 12 Function
- Pindah folder api/lib/ -> lib/
- Update import di api/*.js
- Update vercel.json

### 9. Fix Query Param (cleanUrls)
- File: public/serve.json
- cleanUrls: false + rewrites
- Query param nggak ilang setelah redirect

## Arsitektur

User isi form / buka URL dengan query param
              |
              v
[AI Planner] <- Groq (Tier 1) -> Gemini (Tier 2) -> preset
   Output JSON: { palette, ctaCard, image, gradient }
              |
              v
[Compose] <- lib/pin-templates/_shared/compose.js
   - Resolve palette
   - Render layout (ctaCard / posterLayout)
              |
              v
[Satori -> Resvg] -> PNG 1000x1500

## File Baru/Diubah

**Baru:**
- lib/ai-planner.js
- lib/pin-templates/_shared/compose.js
- lib/pin-templates/_shared/layers.js
- lib/pin-templates/_shared/palettes.js
- lib/pin-templates/_shared/presets.js
- lib/pin-templates/_shared/slangs.js
- lib/pin-templates/_shared/poster.js
- lib/fonts/PlusJakartaSans-Regular.ttf
- lib/fonts/PlusJakartaSans-SemiBold.ttf
- lib/fonts/PlusJakartaSans-Bold.ttf
- lib/fonts/Fraunces-Italic.ttf
- public/serve.json

**Diubah:**
- lib/pin-generator.js
- api/generate-blog.js
- api/generate-pin.js
- api/settings.js
- public/admin/config.yml
- public/admin/pin-generator.html
- vercel.json

## Environment Variables (Vercel)

- GROQ_API_KEY
- GEMINI_API_KEY
- AI_PROVIDER_ORDER=gemini,groq

## Cara Pakai

### Dari Form Artikel
1. Tulis artikel di Decap CMS
2. Isi field CTA Pin (opsional)
3. Publish
4. Buka URL dengan query param

### Dari Pin Generator
1. Buka /admin/pin-generator.html
2. Isi form (judul, kategori, URL gambar)
3. Klik Generate Semua Style
4. Tunggu 40-50 detik (7 style)
5. Download PNG

## Catatan Teknis

- Satori tidak support grid / position fixed - pakai flexbox
- Font harus di-load manual (lib/fonts/)
- Groq butuh kata JSON di prompt biar response_format jalan
- Serve package default cleanUrls true - matikan via serve.json
- Vercel Hobby plan limit 12 serverless functions

## Pelajaran Penting

1. Jangan pakai cat heredoc untuk file JS dengan backtick - shell bisa interpretasi. Pakai nano atau python3.
2. Vercel Hobby plan limit 12 function - file di api/lib/ ke-hitung function. Pindah ke lib/.
3. serve package cleanUrls - query param bisa ilang. Fix pakai serve.json.
4. Prompt AI perlu iterasi - hasil pertama sering aneh, perlu fine-tune.

## TODO Selanjutnya (Opsional)

- 40+ palet warna lagi
- Tombol Generate Pin di form artikel (1 klik)
- Batch generate (banyak artikel sekaligus)
- Upload hasil pin ke Vercel Blob (share URL)
- Style collage/listikel (angka + grid gambar)

---

Laporan dibuat: 8 Oktober 2026, setelah commit 73197ea.
