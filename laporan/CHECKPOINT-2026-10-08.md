# Checkpoint — 8 Oktober 2026

**Repo:** /home/alto/Katalog-Affiliate
**Branch:** main
**Commit:** c99e49c — Add Warm pin template: warm minimalis organik style
**Status:** Repo bersih, sinkron dengan origin/main

## Ringkasan

Checkpoint sebelum implementasi AI Planner untuk Pin Generator.
AI Planner akan pakai Gemini + Groq (dua-duanya gratis) buat koordinasi layout otomatis.

## Yang Sudah Selesai

### Pin Generator — Style Warm (SELESAI)
- api/lib/pin-templates/warm.js — template baru, warm minimalis organik
- api/lib/pin-generator.js — import + registry warm: renderWarm
- public/admin/pin-generator.html — entry { key: 'warm', label: 'Warm' }
- Terbukti render di lokal (localhost:3001/admin/pin-generator.html)
- Commit c99e49c sudah di-push ke GitHub

### Style Tersedia Saat Ini (4)
| Style | File | Vibe |
|---|---|---|
| minimalis | minimalis.js | Cream, rounded, judul bold |
| bold | bold.js | Color block terracotta + charcoal |
| editorial | editorial.js | Magazine style, header brand |
| warm | warm.js | Warm minimalis organik, pita cokelat |

## Rencana Selanjutnya — AI Planner

### Tujuan
AI sebagai "desainer" yang ngasih koordinat & instruksi layout (JSON),
bukan generate gambar. Output JSON di-feed ke Satori.

### Arsitektur
Input: judul, kategori, foto
  ↓
AI Planner: Groq (Tier 1) → Gemini (Tier 2) → preset fallback
  Output: { textCard, image, gradient, cta } dalam JSON
  ↓
Layer Composer: _shared/layers.js + compose.js
  ↓
Satori → PNG

### Provider AI (Gratis)
| Provider | Kuota | Posisi |
|---|---|---|
| Groq | 14.400 req/hari | Tier 1 (utama) |
| Gemini | 1.500 req/hari | Tier 2 (backup) |

Keduanya OpenAI-compatible — pakai SDK openai yang sama.

### File yang Akan Dibuat
- api/lib/ai-planner.js — call Groq + Gemini, return JSON layout
- api/lib/pin-templates/_shared/layers.js — helper layer reusable
- api/lib/pin-templates/_shared/compose.js — plan → JSX Satori
- api/lib/pin-templates/_shared/presets.js — fallback layout default

### File yang Akan Diubah
- api/lib/pin-generator.js — panggil planLayout() + composeFromPlan()
- .env + Vercel env — tambah GROQ_API_KEY & pastikan GEMINI_API_KEY aktif

## Cara Rollback ke Checkpoint Ini

cd ~/Katalog-Affiliate
git reset --hard c99e49c
npm run build

## Catatan Penting

- Jangan commit .env, .env.local, atau file .bak
- Gaya kode: ES modules, 2 spasi, single quotes, titik koma
- Setiap ubah public/admin/* — wajib npm run build + hard refresh browser
- Groq butuh kata "JSON" di prompt biar response_format jalan
- Satori tidak support grid / position fixed — hanya flexbox & absolute

---

Checkpoint dibuat: 8 Oktober 2026, sebelum implementasi AI Planner.
