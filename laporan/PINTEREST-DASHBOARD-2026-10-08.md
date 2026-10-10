# Pinterest Dashboard — 8 Oktober 2026

**Repo:** /home/alto/Katalog-Affiliate
**Branch:** main
**Status:** Dashboard Pinterest live di production (alfeto.vercel.app)
**Total fitur:** 12 fitur besar

## Ringkasan

Fokus: bikin **Pinterest Dashboard** lengkap — generate otomatis pin dari artikel blog, tracking jadwal, config jadwal, semua di dalam CMS Decap.

Hasil akhir: **Dashboard 4 tab** yang bisa generate 3 pin per artikel, auto-upload Blob, auto-jadwal, tracking persistent di Vercel Blob.

## Fitur yang Selesai

### 1. Article Parser (`lib/article-parser.js`)
- Baca artikel dari `src/content/blog/*.md`
- Parse frontmatter pakai `js-yaml` (robust)
- Return: title, slug, category, heroImage, productIds, articleUrl
- Handle nested YAML (`advanced.category`)

### 2. Pinterest Store (`lib/pinterest-store.js`)
- Database JSON di Vercel Blob (private store)
- Struktur: config + articles + pins
- Fungsi: readPinterestData, writePinterestData, updateArticle, deleteArticle, updateConfig
- Token: BLOB_AI_CONFIG_READ_WRITE_TOKEN (reuse)

### 3. Stats API (`api/pinterest-stats.js`)
- GET stats: totalPins, scheduledPins, publishedPins, todayPins, totalArticles, trackedArticles
- Return config + list artikel + pins (untuk kalender)
- Auth token (opsional via PINTEREST_ADMIN_TOKEN)

### 4. Batch Generator (`lib/batch-generator.js`)
- Generate pin dari banyak artikel sekaligus
- Loop tiap artikel × style:
  - Generate PNG (pin-generator)
  - Upload Blob (blob-uploader)
  - Generate keywords (ai-planner)
  - Auto-assign board (board-mapper)
- Assign jadwal (skip waktu lewat)
- Anti race condition: tulis SEKALI di akhir
- Auto-offset: mulai dari jadwal terakhir + 1 hari

### 5. Generate API (`api/pinterest-generate.js`)
- POST batch generate
- Body: { slugs: [], styles: [] }
- Max 10 artikel per batch
- maxDuration: 60s

### 6. Schedule API (`api/pinterest-schedule.js`)
- GET config jadwal
- PUT update config (pinsPerArticle, postTimes, autoOffset, styles, timezone)
- Validasi input

### 7. Dashboard (`public/admin/pinterest-dashboard.html`)
- 4 tab: Overview, Artikel, Jadwal, Pengaturan
- Modal Generate Baru
- Kalender 7 hari
- List pin terjadwal
- Form config
- Toast feedback

## Arsitektur
Blog artikel (src/content/blog/*.md)
↓
[Article Parser] → baca frontmatter
↓
[Dashboard] ← user pilih artikel
↓
[Batch Generator]
├─ Generate pin (AI Planner + Satori)
├─ Upload Blob (public)
├─ Keywords AI (Groq/Gemini)
├─ Board auto-assign
└─ Jadwal (skip lewat, auto-offset)
↓
[Pinterest Store] → simpan tracking di Blob
↓
[Dashboard] → tampilkan stats + kalender
↓
[CSV Export] → upload ke Pinterest
## File Baru/Diubah

**Baru:**
- lib/article-parser.js
- lib/pinterest-store.js
- lib/batch-generator.js
- api/pinterest-stats.js
- api/pinterest-generate.js
- api/pinterest-schedule.js
- public/admin/pinterest-dashboard.html

**Diubah:**
- public/admin/index.html (shortcut Dashboard)
- package.json (js-yaml)
- public/admin/pin-generator.html (dari sesi sebelumnya)

## Cara Pakai

### 1. Buka Dashboard https://alfeto.vercel.app/admin/pinterest-dashboard.html 
### 2. Generate Pin dari Artikel
- Tab Artikel → "+ Generate Baru"
- Pilih artikel (checkbox)
- Klik "Generate X Pin"
- Tunggu ~40 detik per artikel

### 3. Atur Jadwal
- Tab Pengaturan
- Set jam posting (06:00, 12:00, 17:00)
- Set pin per artikel (3)
- Auto-offset: ON

### 4. Lihat Jadwal
- Tab Jadwal
- Kalender 7 hari dengan pin count
- List pin terjadwal

## Konfigurasi

### Config Default
```json
{
  "pinsPerArticle": 3,
  "defaultStyles": ["minimalis", "editorial", "warm"],
  "postTimes": ["06:00", "12:00", "17:00"],
  "timezone": "WIB",
  "autoOffset": true,
  "lastScheduled": null
} Env Variables
BLOB_AI_CONFIG_READ_WRITE_TOKEN (existing)

BLOB_PIN_READ_WRITE_TOKEN (public store)

PINTEREST_ADMIN_TOKEN (opsional auth)

Catatan Teknis
Bug yang Difix
Race condition di batch-generator — updateArticle per loop vs writePinterestData di akhir → fix: tulis SEKALI di akhir

Tab Artikel nggak muncul — event listener forEach bentrok → fix: initTabs() setelah DOMContentLoaded

Jadwal masa lalu — startDate sekarang + postTimes 06:00 → kemarin → fix: skip candidate <= now

js-yaml import — default vs named export → fix: import { load as yamlLoad }

Pelajaran Penting
Vercel Blob eventual consistency — read setelah write bisa belum ke-update

Jangan updateArticle di loop — bisa race condition, kumpulkan dulu

Event listener tab — pakai DOMContentLoaded + initTabs() setelah DOM ready

js-yaml ESM — pakai named export { load }

Waktu UTC vs WIB — jadwal 2026-10-08T23:00:00Z = 2026-10-09 06:00 WIB

TODO Selanjutnya
Prioritas Tinggi
□ Board Mapping editor di Pengaturan
□ Tombol "Generate Pin" di form artikel Decap
□ Progress bar visual untuk batch generate
Prioritas Sedang
□ Upload CSV ke Pinterest otomatis (Playwright)
□ Analytics — tracking performa pin
□ Bulk operation — 50 artikel sekaligus
Prioritas Rendah
□ Auto-post scheduler (cron)
□ Backup data ke GitHub
□ Testing (pytest)
Statistik Sesi
Prompt: ~108 prompt

File baru: 7

File diubah: 3

Commit: ~10

Fitur: 12 fitur besar

Waktu: ~6 jam Laporan dibuat: 8 Oktober 2026, setelah commit 93b0814.

## Update: Fase 3 — Jadwal + Pengaturan + Board Mapping (SELESAI)

### Fitur Baru

**Tab Jadwal:**
- Kalender 7 hari dengan pin count
- List semua pin terjadwal (judul, style, board, tanggal)
- Hari ini di-highlight

**Tab Pengaturan:**
- Pin per artikel (dropdown 1-7)
- Jam posting (multi-select pill)
- Auto-offset (toggle)
- Style default (multi-select pill)
- Timezone (WIB/WITA/WIT)
- Save + Reset

**Board Mapping:**
- CRUD board dari UI (tanpa edit kode)
- Setiap board: nama + weight + keywords
- Bulk PUT (anti race condition)
- Reset ke default

### API Baru

- `api/pinterest-schedule.js` — GET/PUT config jadwal
- `api/pinterest-boards.js` — GET/PUT/POST/DELETE board

### Store Update

- `pinterest-store.js` — tambah `boards` field + `updateBoards()`, `resetBoards()`, `getBoardsData()`
- `board-mapper.js` — baca board dari store (bukan hardcode) + cache 60 detik
- `batch-generator.js` — `await assignBoard()` (async)

### Bug yang Difix

1. **Race condition board save** — loop PUT per board vs bulk PUT → **fix: bulk PUT**
2. **`assignBoard` async** — nggak ada `await` → board jadi `[object Promise]` → **fix: await**
3. **Cache board 60 detik** — biar nggak baca Blob tiap panggilan

### File Update

**Baru:**
- api/pinterest-schedule.js
- api/pinterest-boards.js

**Diubah:**
- lib/pinterest-store.js
- lib/board-mapper.js
- lib/batch-generator.js
- public/admin/pinterest-dashboard.html

---

Update laporan: 8 Oktober 2026, setelah commit 4089840.
