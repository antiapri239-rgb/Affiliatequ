# Laporan Teknis Alfeto — Panduan Lanjutan untuk AI

**Tanggal snapshot:** 7 Oktober 2026  
**Repository:** `/home/alto/Katalog-Affiliate`  
**Branch saat laporan dibuat:** `main`  
**Catatan:** laporan ini menjelaskan implementasi yang ditemukan di repository pada
tanggal snapshot, bukan rancangan fitur sebagai fitur yang sudah selesai.
Jangan menaruh secret dalam laporan, log, atau commit.

## 1. Ringkasan Proyek

### Tujuan

Alfeto adalah katalog produk dekorasi rumah dan blog inspirasi interior. Konten
produk, kategori, dan artikel dapat dikelola lewat Decap CMS di `/admin/`.
Generator artikel AI di CMS membuat isi artikel berbahasa Indonesia, deskripsi,
dan tags melalui endpoint server-side sehingga API key tidak dikirim ke browser.

### Stack dan layanan

| Bagian | Teknologi / layanan |
|---|---|
| Website | Astro 5, output static |
| Styling | Tailwind CSS melalui `@astrojs/tailwind` |
| Konten | Astro Content Collections, Markdown/MDX |
| CMS | Decap CMS 3.x, dimuat dari unpkg |
| API AI | Vercel Serverless Function (`api/generate-blog.js`) |
| Provider AI yang benar-benar ada | Gemini melalui `@google/generative-ai` |
| Source/deploy | GitHub; Vercel terhubung ke repository |
| Login CMS | GitHub backend Decap melalui OAuth proxy Cloudflare Worker |
| Jadwal terbit | GitHub Actions workflow yang memanggil Vercel Deploy Hook |

**Bukan aplikasi Next.js.** Route AI di sini adalah Vercel Function berbasis
Node, bukan Next.js App Router. Karena itu setting durasi juga ada di
`vercel.json`, selain export `maxDuration` yang digunakan Vercel.

### Struktur folder utama

```text
Katalog-Affiliate/
├── api/
│   ├── generate-blog.js
│   └── lib/
│       ├── ai-provider.js
│       └── providers/
│           └── gemini.js
├── public/
│   └── admin/
│       ├── config.yml
│       ├── generate-blog-widget.js
│       ├── index.html
│       └── product-preview.js
├── src/
│   ├── components/
│   ├── content/blog/
│   ├── data/
│   ├── pages/
│   └── styles/
├── .github/workflows/
│   └── scheduled-blog-publish.yml
├── decap-proxy/             # OAuth Worker; diabaikan Git root
├── laporan/
├── scripts/
├── .env.example
├── README.md
├── astro.config.mjs
├── package.json
└── vercel.json
```

`node_modules/`, `.astro/`, `dist/`, dan `.vercel/` merupakan dependency/cache/
hasil build atau data lokal, bukan sumber utama yang perlu diedit.

## 2. Arsitektur AI Generator

### Alur

1. `public/admin/config.yml` mendaftarkan `ai-markdown` untuk isi artikel,
   `ai-description` untuk deskripsi, dan `ai-tags` untuk tags.
2. `public/admin/generate-blog-widget.js` mengambil judul dan kategori dari form
   Decap. Judul dan kategori dikirim sebagai JSON ke `/api/generate-blog`.
3. Vercel Function memvalidasi metode, feature flag, request body, batas panjang,
   dan keberadaan Gemini API key.
4. Endpoint memanggil `generateArticle()` dari abstraction layer.
5. `api/lib/ai-provider.js` memilih `AI_PROVIDER` (default `gemini`). Saat ini
   hanya provider `gemini` yang didaftarkan.
6. `api/lib/providers/gemini.js` memanggil Gemini dengan `generateContentStream`,
   mengumpulkan keluaran JSON, memvalidasi article/description/tags, lalu
   mengirim artikel ke callback endpoint.
7. Endpoint menulis event NDJSON. Widget mendekode stream UTF-8, memproses setiap
   baris event, memperbarui editor, lalu mengisi metadata setelah `done`.

### Diagram request

```text
Editor Decap CMS
  │ POST { title, category }
  ▼
Vercel Function: /api/generate-blog
  │ validasi, ENABLE_AI_GENERATOR, GEMINI_API_KEY
  ▼
api/lib/ai-provider.js
  │ AI_PROVIDER (saat ini: gemini saja)
  ▼
api/lib/providers/gemini.js
  │ Gemini generateContentStream
  │ retry primary → model fallback bila memenuhi kondisi fallback
  │ kumpulkan JSON dan validasi metadata
  ▼
Vercel Function menulis NDJSON
  │ article → metadata → done
  ▼
Widget Decap membaca ReadableStream dan memperbarui editor
```

Groq **tidak ada** di diagram implementasi: file `api/lib/providers/groq.js`,
dependency Groq, dan pemetaan provider Groq belum tersedia. “Gemini/Groq” hanya
boleh dipakai sebagai tujuan rancangan sampai implementasi provider Groq dibuat.

### Event NDJSON

Setiap event adalah satu objek JSON per baris dan diakhiri `\n`.

| `type` | Bentuk contoh | Makna |
|---|---|---|
| `article` | `{"type":"article","text":"..."} ` | Potongan teks artikel. Potongan ditambahkan ke isi artikel saat widget membaca stream. |
| `metadata` | `{"type":"metadata","description":"...","tags":["..."]}` | Deskripsi dan tags yang dikirim sesudah proses provider berhasil. |
| `done` | `{"type":"done"}` | Penanda sukses selesai; payload tidak memakai kata `selesai`. |
| `error` | `{"type":"error","error":"..."}` | Penanda gagal setelah stream dimulai. Karena headers sudah dikirim, error ini adalah event di body (HTTP bisa tetap 200), bukan perubahan status HTTP. |

Error sebelum headers stream dimulai—misalnya generator dinonaktifkan atau API
key tidak ada—dikembalikan sebagai JSON dengan status HTTP. Error saat provider
berjalan dikirim sebagai NDJSON `error`.

**Catatan perilaku streaming penting:** provider saat ini mengumpulkan seluruh
hasil Gemini, melakukan parse dan validasi, lalu memanggil `onArticleChunk`
sekali dengan artikel final. Endpoint/widget mendukung beberapa event artikel,
tetapi provider belum mengirim token artikel Gemini ke browser secara langsung.
Ini sengaja menghindari potongan artikel percobaan yang gagal ikut terkirim
sebelum retry/fallback selesai.

## 3. Daftar File Kunci

Path di bawah relatif terhadap root repository
`/home/alto/Katalog-Affiliate`.

### `api/generate-blog.js`

- **Path penuh:** `/home/alto/Katalog-Affiliate/api/generate-blog.js`
- **Fungsi:** HTTP boundary Vercel untuk generator.
- **Export:**
  - `maxDuration = 60`: deklarasi batas function 60 detik.
  - `default handler(request, response)`: validasi dan jalankan generator.
- **Validasi/status:**
  - Hanya `POST`; method lain `405`.
  - `ENABLE_AI_GENERATOR` harus tepat bernilai string `"true"`; jika tidak `403`.
  - Body harus object JSON dengan `title` dan `category`.
  - Maksimum judul 200 karakter dan kategori 100 karakter.
  - Gemini API key yang hilang mengembalikan `503` sebelum streaming dimulai.
  - Setelah validasi, headers NDJSON ditetapkan dan `flushHeaders()` dipanggil.
- **Event:** callback provider menulis `article`; setelah sukses endpoint menulis
  `metadata` dan `done`; exception menulis `error` dan log server.
- **Dependency:** `api/lib/ai-provider.js`; API response Vercel/Node.
- **Rawan error/perhatian:**
  - Sesudah `flushHeaders`, status HTTP tidak praktis diubah; kegagalan AI harus
    dikenali dari event NDJSON `error`.
  - Endpoint memeriksa `GEMINI_API_KEY` secara langsung, walaupun provider
    dipilih abstraction layer. Saat menambah provider lain, ubah pemeriksaan
    credential ini agar tidak mewajibkan key Gemini untuk semua provider.
  - Jangan mengubah nama/struktur event tanpa mengubah reader CMS dan contoh
    integrasi.

### `api/lib/ai-provider.js`

- **Path penuh:** `/home/alto/Katalog-Affiliate/api/lib/ai-provider.js`
- **Fungsi:** registry dan pemilihan provider.
- **Export penting:** `generateArticle({ title, category, onArticleChunk })`.
- **Dependency:** `api/lib/providers/gemini.js`.
- **Implementasi saat ini:** registry berisi `gemini` saja; default `AI_PROVIDER`
  adalah `gemini`. Nilai provider lain melempar `Unsupported AI provider`.
- **Rawan error/perhatian:** tidak ada otomatisasi Gemini → Groq atau fallback
  provider lintas layanan. Tambahkan import, registry entry, kontrak hasil
  bersama, dan pengujian bila provider baru dibuat.

### `api/lib/providers/gemini.js`

- **Path penuh:** `/home/alto/Katalog-Affiliate/api/lib/providers/gemini.js`
- **Fungsi:** prompt, pemanggilan Gemini, validasi response dan ketahanan error.
- **Export penting:** `generateWithGemini({ title, category, onArticleChunk })`.
- **Dependency:** `@google/generative-ai` (versi yang tercatat di manifest:
  `^0.24.1`).
- **Konfigurasi saat ini:**
  - Primary: `gemini-3.8-flash` (konstanta kode).
  - Fallback: `GEMINI_FALLBACK_MODEL` atau default `gemini-3.6-flash`.
  - Max output 2048 token; response diminta sebagai JSON.
  - Prompt meminta bahasa Indonesia, Markdown tanpa H1, deskripsi dan tags.
- **Retry:** lihat bagian 5.
- **Rawan error/perhatian:**
  - `gemini-3.6-flash` fallback harus diverifikasi aktif/diizinkan untuk API key
    deployment; jika tidak, error fallback akan sampai ke frontend.
  - Fallback dipilih saat primary memberi `404` atau setelah retry primary
    menghabiskan error `5xx`. Error `400`/`403` tidak di-retry atau difallback.
  - Error `429` saat ini tidak termasuk retry (`4xx`).
  - Output provider dibuffer sebagai JSON lengkap sebelum callback artikel
    dipanggil; ini memengaruhi makna “real-time stream” di UI.
  - Model primary ditetapkan di kode; `GEMINI_MODEL` tidak mengubahnya.
  - `FALLBACK_MODEL` dibaca saat module di-load; perubahan env memerlukan
    function restart/redeploy.

### `api/lib/providers/groq.js`

- **Path yang diminta:** `/home/alto/Katalog-Affiliate/api/lib/providers/groq.js`
- **Status:** **tidak ada** dalam repository saat snapshot.
- Tidak ada fungsi/export, dependency, maupun environment variable Groq.
- Belum ada fallback Gemini → Groq. Jangan mendokumentasikan atau mengandalkan
  provider Groq sampai file, dependency, konfigurasi key, pemetaan registry,
  dan pengujian dibuat.

### `public/admin/generate-blog-widget.js`

- **Path penuh:** `/home/alto/Katalog-Affiliate/public/admin/generate-blog-widget.js`
- **Fungsi:** Decap custom widgets untuk tombol generator dan metadata hasil.
- **Fungsi penting:**
  - `readCurrentField(labelText)`: baca field dari form CMS.
  - `readEntryValue(entry, path)`: fallback baca nilai Immutable entry Decap.
  - `processLine(line)`: parse satu baris NDJSON dan lempar event `error`.
  - `readArticleStream(response, onArticleText)`: UTF-8 decode, buffer baris yang
    belum lengkap, proses event artikel/metadata/done.
  - `generateArticle(payload, onArticleText)`: POST ke endpoint, cek `response.ok`,
    ambil pesan JSON untuk HTTP non-2xx, lalu baca stream.
  - Widget control `AIArticleControl` menggabungkan nilai artikel dan mengisi
    deskripsi/tags yang masih kosong.
- **Dependency:** global Decap `CMS`, React-style `createClass`/`h`, browser
  `fetch`, `ReadableStream`, `TextDecoder`.
- **Rawan error/perhatian:**
  - API sukses mengembalikan NDJSON, bukan Markdown mentah. Jangan mengirim
    setiap byte mentah langsung ke `onChange`; itu akan menaruh `{"type":...}`
    pada isi artikel.
  - Baris JSON dapat terbelah di antara beberapa byte/chunk. Buffer sampai `\n`.
  - Event `error` datang dalam stream walaupun HTTP status 200.
  - Error UI ditampilkan via `alert` dan state CMS; console menyimpan detail.
  - Jika stream gagal setelah artikel mulai berubah, kode memulihkan nilai
    sebelumnya.

### `public/admin/config.yml`

- **Path penuh:** `/home/alto/Katalog-Affiliate/public/admin/config.yml`
- **Fungsi:** konfigurasi backend dan koleksi Decap CMS.
- **Bagian penting:** GitHub backend `raddenpattah/Katalog-Affiliate`, branch
  `main`; editorial workflow; kategori, produk, dan blog.
- **Widget AI:** field `description` memakai `ai-description`, `body` memakai
  `ai-markdown`, dan `advanced.tags` memakai `ai-tags`.
- **Dependency:** Decap CMS yang dimuat dari CDN pada `public/admin/index.html`;
  custom widgets pada `generate-blog-widget.js`.
- **Rawan error/perhatian:**
  - CMS menggunakan GitHub backend; save/publish artikel menulis ke Git/GitHub.
  - Ini bukan tempat penyimpanan runtime config AI tanpa commit.
  - Custom widget names harus sama dengan nama `CMS.registerWidget`.
  - OAuth `base_url` harus sesuai Worker aktif; jangan menaruh OAuth secret di
    repository.

### `vercel.json`

- **Path penuh:** `/home/alto/Katalog-Affiliate/vercel.json`
- **Fungsi:** deklarasi framework `astro` dan function config.
- **Konfigurasi penting:** `api/generate-blog.js` diberi `maxDuration: 60`.
- **Dependency:** deployment Vercel.
- **Rawan error/perhatian:** total waktu Gemini, semua backoff, percobaan fallback,
  transfer stream, dan overhead harus muat dalam batas 60 detik. Plan Vercel
  dapat membatasi durasi maksimum; validasi dengan plan/project aktual.

### `.env.example`

- **Path penuh:** `/home/alto/Katalog-Affiliate/.env.example`
- **Fungsi:** template lokal, bukan tempat menyimpan key sebenarnya.
- **Isi yang relevan:** `ENABLE_AI_GENERATOR`, placeholder
  `GEMINI_API_KEY`, dokumentasi `GEMINI_FALLBACK_MODEL`, `AI_PROVIDER`.
- **Rawan error/perhatian:** file `.env.local` masuk ignore `.env*`; jangan pernah
  menghapus ignore atau commit key. `.env.example` mesti sinkron dengan
  konfigurasi yang benar-benar dipakai kode.

### `README.md`

- **Path penuh:** `/home/alto/Katalog-Affiliate/README.md`
- **Fungsi:** petunjuk instalasi, build, CMS, generator AI, jadwal publish, OAuth.
- **Informasi AI:** local run dengan `npx vercel dev`; feature flag/key;
  konfigurasi model, stream NDJSON, retry dan fallback; contoh `fetch`.
- **Dependency:** dokumentasi lain dalam proyek; tidak dieksekusi runtime.
- **Rawan error/perhatian:** update segera ketika model, nama event, fallback,
  endpoint, env, atau batas durasi berubah. Contoh harus tetap menunjukkan
  event NDJSON, bukan stream raw text.

## 4. Konfigurasi Environment Variable

Nilai di tabel hanya contoh placeholder. **Jangan menyalin API key nyata ke
laporan, chat, log, source control, atau browser.**

| Nama | Fungsi | Contoh aman | Wajib? | Penempatan |
|---|---|---|---|---|
| `ENABLE_AI_GENERATOR` | Mengaktifkan endpoint hanya jika nilai tepat `true`. | `true` | Wajib untuk mengaktifkan fitur | `.env.local` lokal; Vercel Production/Preview sesuai deployment |
| `GEMINI_API_KEY` | Autentikasi Gemini server-side. | `<GEMINI_API_KEY>` | Wajib untuk provider saat ini | `.env.local`; Vercel Environment Variables. Jangan expose sebagai `PUBLIC_*`. |
| `GEMINI_FALLBACK_MODEL` | Model cadangan setelah primary 404 atau 5xx berulang. | `gemini-3.6-flash` | Opsional; default kode sama | `.env.local` dan Vercel jika ingin mengganti default. Pastikan model tersedia untuk key. |
| `AI_PROVIDER` | Memilih provider dari registry. | `gemini` | Opsional; default `gemini` | Lokal/Vercel. Saat ini nilai lain tidak didukung. |
| `GEMINI_MODEL` | Pernah dibahas di dokumentasi lama, tetapi tidak dibaca provider saat ini. | — | Tidak digunakan | Jangan mengandalkan env ini; primary model ditetapkan di kode. |
| `SITE_URL` | URL canonical Astro jika disediakan. | `https://example.com` | Opsional | Build environment lokal/Vercel |
| `VERCEL_PROJECT_PRODUCTION_URL` | Fallback `site` Astro yang disediakan Vercel, ditambah `https://`. | `alfeto.vercel.app` | Opsional/built-in Vercel | Otomatis dari Vercel; jangan diset manual kecuali ada alasan |
| `GITHUB_OUTPUT` | File output step GitHub Actions untuk script jadwal. | Disediakan runner | Bukan secret; hanya saat workflow | Otomatis dari GitHub Actions |
| `VERCEL_DEPLOY_HOOK` | Trigger deployment untuk scheduled blog publish. | `<VERCEL_DEPLOY_HOOK_URL>` | Wajib agar workflow terjadwal dapat deploy | GitHub Actions repository secret, bukan `.env.local` |

`GEMINI_FALLBACK_MODEL` dan `AI_PROVIDER` diinisialisasi saat module provider
dibaca. Untuk perubahan environment Vercel, buat deployment baru/redeploy.
`.env.local` hanya mengatur runtime lokal dan tidak otomatis mengubah Production.

## 5. Logika Retry & Fallback

### Retry per model

Di `gemini.js`:

- `RETRY_DELAYS_MS = [1000, 2000, 4000]`.
- Ada maksimum **3 retry sesudah percobaan pertama**, jadi maksimal 4 request
  untuk satu model.
- Hanya status HTTP `500–599` yang dicoba ulang.
- `400`, `403`, `429`, dan error tanpa status HTTP tidak dicoba ulang.
- Log server mencatat model, nomor percobaan, status error, dan waktu tunggu.

### Fallback model

- Primary saat ini `gemini-3.8-flash`.
- Default fallback `gemini-3.6-flash`; dapat diganti dengan
  `GEMINI_FALLBACK_MODEL`.
- Setelah primary menghabiskan retry untuk 5xx, fungsi mencoba fallback.
- Primary `404` langsung diarahkan ke fallback; 400/403 dan error non-5xx lain
  selain 404 langsung dilempar tanpa fallback.
- Fallback menggunakan jadwal retry 1/2/4 detik yang sama untuk error 5xx.
- Keluaran tiap percobaan ditahan dan baru dikirim ke callback setelah model
  menghasilkan JSON valid, supaya potongan dari percobaan gagal tidak
  terduplikasi.

### Maksimum percobaan dan waktu

- Jalur primary maksimum 4 request; fallback maksimum 4 request.
- Kasus penuh primary 5xx lalu fallback 5xx: maksimum 8 request dan waktu tidur
  maksimum 14 detik (7 detik per model), belum termasuk waktu respons API.
- Primary `404` dapat memulai fallback tanpa tidur/retry primary.
- Vercel Function `maxDuration` = **60 detik** pada `vercel.json` dan export
  route. Ini bukan jaminan semua percobaan selesai: latensi provider ditambah
  14 detik backoff dapat melampaui 60 detik.
- Belum ada time budget internal yang membagi sisa durasi ke tiap request,
  `AbortController`, atau pembatasan total request terpisah. Tambahkan jika
  pengujian menunjukkan function masih timeout.

### Fallback provider

Tidak ada Gemini → Groq. `ai-provider.js` hanya mendaftarkan Gemini, dan file
Groq tidak ada. Model fallback di atas tetap provider Gemini yang sama.

## 6. Masalah yang Sudah Ditangani

| Masalah | Tindakan/status |
|---|---|
| Gemini `503 Service Unavailable` / kapasitas tinggi | Retry 3 kali dengan exponential backoff, lalu coba model fallback; seluruh percobaan 5xx masih dapat gagal. |
| Model Gemini `404`/tidak tersedia | `gemini-1.5-flash` dan `gemini-2.5-flash` pernah menghasilkan 404 pada screenshot/akun pengguna. Primary yang dikonfigurasi sekarang `gemini-3.8-flash`; fallback diberi default `gemini-3.6-flash`. Ketersediaan kedua model harus dikonfirmasi dengan API key deployment. |
| Vercel Function terlalu lama | Ditambahkan `maxDuration: 60` ke function config dan `export const maxDuration = 60`; retry tetap dapat menghabiskan durasi tersebut. |
| Pesan backend tertutup pesan generik | Endpoint mengirim `error.message` dalam event NDJSON error dan widget melemparkan pesan event itu. |
| Format response streaming rentan terbelah di batas chunk | Reader mem-buffer teks UTF-8 hingga menemukan newline sebelum parse event JSON. |
| Potongan artikel percobaan yang gagal berisiko tercampur | Provider menahan hasil per model/percobaan dan mengirim artikel setelah validasi berhasil. |
| File environment lokal awal salah nama | File `.env.local.` sempat dinormalisasi menjadi `.env.local`; nilai key tidak dicatat di sini. |
| Variabel Vercel dan lokal tertukar | Dokumentasi menjelaskan `.env.local` lokal berbeda dari Environment Variables Vercel dan perubahan Production perlu redeploy. |
| Error 400/403 | Tidak di-retry; error server/klien dibedakan berdasarkan status HTTP. |

Error `Server tidak mengembalikan artikel beserta metadata yang lengkap` adalah
validasi frontend/provider, bukan bukti bahwa semua penyebab sudah terselesaikan.
Periksa event `metadata` dan `done`, output JSON model, dan deployment yang sedang
diakses jika pesan ini muncul kembali.

## 7. Masalah yang Belum Selesai / TODO

- **Fitur Pengaturan AI di CMS belum dibuat.** Provider/model tidak dapat diubah
  lewat UI CMS tanpa mengubah sistem yang ada.
- **Groq belum terimplementasi.** Tidak ada `groq.js`, SDK, key env, registry
  entry, maupun test provider.
- **Model fallback belum terverifikasi live.** Pastikan
  `gemini-3.6-flash` benar-benar tersedia untuk API key akun Vercel. Ganti
  `GEMINI_FALLBACK_MODEL` bila tidak tersedia.
- **Tes langsung ke Gemini production belum terdokumentasi berhasil.** Build
  lokal/mock retry tidak membuktikan API key, akses model, kuota, dan Vercel
  runtime Production berfungsi.
- **Backoff bisa menabrak batas 60 detik.** Perlu memutuskan time budget dan
  batas timeout per panggilan provider.
- **Provider belum mengirim token Gemini real-time.** Fungsi menunggu seluruh
  JSON Gemini, baru mengeluarkan satu event article. Jika benar-benar perlu
  melihat teks saat model mengetik, desain format output perlu diubah (misalnya
  stream artikel terpisah dari metadata) dengan mempertimbangkan retry dan
  duplikasi.
- **Endpoint belum memakai autentikasi aplikasi tambahan untuk generator.**
  Feature flag dan API key server-side ada, namun pertimbangkan rate limiting,
  quota, dan kontrol akses CMS bila endpoint berisiko disalahgunakan.
- **Settings tanpa commit/push belum ada.** Sampai fitur settings dibuat,
  pengaturan model harus berasal dari env/kode; perubahan kode perlu deploy.
- **Status deploy:** cek Vercel Production deployment, log function terbaru,
  dan environment Production sebelum menyimpulkan situs live memakai commit
  lokal.
- **Commit/push:** status Git pada snapshot laporan ini `main` sinkron dengan
  `origin/main`; jalankan `git status -sb` sebelum meneruskan karena status dapat
  berubah sesudah laporan dibuat.

## 8. Rencana Fitur “Pengaturan AI” di CMS

### Tujuan dan batas keamanan

Tujuan: operator dapat mengganti konfigurasi AI non-secret dari CMS tanpa
commit/push/deploy. API key **jangan** disimpan di JSON settings yang dapat
dibaca frontend atau dalam CMS config.

Simpan credential provider sebagai Vercel Environment Variables/secret. UI boleh
menampilkan status “key tersedia” dan nama variabel, tetapi GET tidak pernah
mengirim nilai key. Jika kelak penggantian key lewat UI wajib didukung, gunakan
secret manager yang sesuai; jangan menyimpan key plaintext di Blob/KV.

### Penyimpanan: pilihan dan rekomendasi

1. **Vercel Blob (pilihan praktis untuk berkas config kecil):** simpan satu objek
   JSON privat (misalnya `ai-settings.json`), dibaca server-side oleh Function.
   Tidak memerlukan commit atau redeploy untuk nilai config. Pastikan akses blob
   private dan token tulis hanya berada di server.
2. **Vercel KV/Redis integration:** cocok untuk key-value yang sering dibaca/
   ditulis dan memerlukan operasi cepat/atomik; tetap simpan token Redis hanya
   di server. Periksa nama dan ketentuan integration Vercel yang tersedia pada
   saat implementasi.
3. **File JSON di repository:** implementasi paling sederhana, tetapi Decap
   GitHub backend akan menghasilkan commit/pull request dan perubahan runtime
   perlu deploy. Ini tidak memenuhi tujuan tanpa commit/push; bukan rekomendasi
   untuk requirement ini.

Sebelum memilih Blob, uji akses privat, konsistensi baca sesudah tulis, locking
atau update bersamaan, dan ketersediaan dependency/token pada Vercel Function.
Tambahkan runtime fallback ke env defaults bila store tidak berisi config,
bukan membuka error konfigurasi ke publik.

### Struktur JSON yang disarankan

```json
{
  "version": 1,
  "enabled": true,
  "provider": "gemini",
  "model": "gemini-3.8-flash",
  "fallbackModel": "gemini-3.6-flash",
  "retry": {
    "maxRetries": 3,
    "delaysMs": [1000, 2000, 4000],
    "retryableStatusRanges": [[500, 599]]
  },
  "updatedAt": "2026-10-07T00:00:00.000Z",
  "updatedBy": "admin-user-id"
}
```

Validasi server harus membatasi nama provider/model ke allowlist, retries dan
delays ke batas operasional, dan menolak properti yang tidak dikenal. Credential
tidak boleh menjadi field dalam file ini.

### Endpoint `GET/POST /api/settings`

- `GET`: kembalikan config non-secret efektif, daftar model/provider yang
  diizinkan, `hasApiKey` boolean, dan versi/timestamp. Jangan kembalikan token.
- `POST`: hanya admin terautentikasi yang dapat mengubah config. Validasi schema,
  model allowlist, jenis data, batas retry/delay, ukuran body, dan lakukan
  update atomik atau conditional write.
- Jangan percaya bahwa request dari domain admin otomatis terautentikasi.
  Verifikasi sesi/token dengan server-side auth, batasi role allowlist, cegah
  CSRF (SameSite + token/Origin check), dan tambahkan rate limiting serta audit.
- Hindari memantulkan error storage/secret detail ke respons publik.
- Tambahkan proteksi agar endpoint AI membaca settings yang sama dengan UI dan
  punya fallback yang jelas ke environment bila storage belum siap.

### Perubahan provider abstraction

- Tambahkan registry provider hanya sesudah implementasi provider benar-benar
  tersedia. Saat ini `ai-provider.js` hanya memetakan `gemini`.
- Pindahkan pemilihan provider/model/retry dari konstanta module ke config
  tervalidasi yang dibaca pada request.
- Pertahankan interface konsisten, misalnya
  `generate({ title, category, settings, onArticleChunk })`.
- Validasi credential provider server-side. Gemini sekarang memerlukan
  `GEMINI_API_KEY`; Groq (jika ditambah nanti) memerlukan secret terpisah.
- Unit test: default settings, provider tidak dikenal, model tidak diizinkan,
  storage unavailable, key missing, retry, dan fallback.

### UI Decap CMS

- Tambahkan halaman/panel admin **Pengaturan AI** sebagai custom CMS view/extension
  yang dimuat lewat `public/admin/index.html`; jangan menyimpan settings runtime
  melalui koleksi GitHub bila sasaran utamanya tanpa commit.
- Field minimal: generator aktif/nonaktif, provider, model utama, model
  fallback, jumlah retry (maksimum tetap dibatasi), dan status key tersedia.
- Tampilkan indikator loading/sukses/error dan tombol simpan; berikan konfirmasi
  sebelum menonaktifkan generator atau mengubah model.
- Jika secret entry benar-benar diperlukan, gunakan input password sekali tulis
  tanpa pernah mengisi kembali nilainya, jangan tampilkan nilainya di state,
  response, log, atau browser storage. Prefer credential tetap di Vercel.

### Setup Vercel Blob (jika dipilih)

1. Buka project Vercel → **Storage** → buat Blob store sesuai fitur private
   access yang tersedia untuk project/account.
2. Hubungkan store ke environment yang dipakai (Production dan Preview secara
   sadar); Vercel dapat menambahkan token env ke project.
3. Pastikan token read/write tersedia hanya untuk API Functions server-side,
   bukan sebagai `PUBLIC_*` atau variable yang ikut bundle browser.
4. Tambahkan dependency resmi Blob SDK hanya setelah keputusan storage dibuat,
   lalu implementasikan helper server-only untuk read/validate/write.
5. Buat config awal non-secret; uji GET/POST dengan role admin, update bersamaan,
   invalid JSON, storage unavailable, dan Preview/Production isolation.
6. Deploy dan cek logs. Rotasi/revoke token jika pernah terekspos; tambah backup
   atau versioning jika konfigurasi perlu rollback.

Konsultasikan dokumentasi Vercel terkini sebelum implementasi; fitur Blob/private
access, menu dashboard, nama env, dan batas plan dapat berubah.

## 9. Commit History

Daftar commit terbaru yang terlihat saat snapshot (urut newest-first):

| Hash | Pesan |
|---|---|
| `825f84b` | Add Gemini retry and fallback |
| `65cf7b0` | Add daily work report |
| `2103846` | Use recommended Gemini Flash model |
| `0a3e67c` | Use supported Gemini Flash model |
| `fb95a1f` | Refine AI article stream errors |
| `9f39c0b` | Log AI article generation errors |
| `ca1aded` | Stream Gemini article generation |
| `a09aa1a` | Complete AI article metadata and preview |
| `15f5f54` | Use Gemini 3.8 Flash by default |
| `7385154` | Enable CMS editorial review workflow |
| `373daf3` | Fix AI widget form field lookup |
| `d72a69e` | Add AI article generation |
| `3c33ba4` | Keep author fixed and move category to advanced |
| `e04016d` | Compact blog editor advanced settings |
| `1769052` | Add scheduled publishing for blog posts |

Pada snapshot terakhir, `git status -sb` menunjukkan `main` mengikuti
`origin/main` tanpa commit tertinggal. Riwayat bisa maju; periksa ulang status
sebelum push atau membuat perubahan.

## 10. Catatan untuk AI Berikutnya

### Gaya dan pola kode

- Project memakai ES modules (`"type": "module"`), JavaScript async/await untuk
  API, dan Astro untuk web. Tidak ada Next.js.
- Ikuti pola tanpa framework/server tambahan untuk API; gunakan dependency
  project yang ada sebelum menambah dependency.
- API provider mengembalikan `{ article, description, tags }`.
- Gunakan validasi eksplisit dan teruskan error secara jelas; hindari fallback
  yang diam-diam menyamarkan kegagalan.
- Ikuti gaya file yang disentuh: 2 spasi, single quotes di JavaScript, titik koma.

### Hal yang tidak boleh berubah diam-diam

- Kontrak NDJSON: satu JSON object per baris; event types `article`, `metadata`,
  `done`, `error`. Jika berubah, update endpoint, widget, contoh README, dan test
  bersama-sama.
- `article.text` merupakan **delta**, bukan keseluruhan isi, pada kontrak event.
  Widget yang menyimpan artikel mengakumulasi delta.
- Metadata event memuat `description` dan `tags`; jangan memasukkan API key ke
  event mana pun.
- `ENABLE_AI_GENERATOR` saat ini harus string tepat `true`.
- Jangan commit `.env.local`, token Vercel, Gemini key, OAuth secret, atau
  `VERCEL_DEPLOY_HOOK`.
- Jangan mengklaim Groq atau Pengaturan AI CMS sudah ada sebelum implementasi
  dan pengujian benar-benar dibuat.

### Debugging

1. Pastikan URL yang dites lokal (`http://localhost:3000` dengan `npx vercel
   dev`) atau Production/Preview; environment-nya berbeda.
2. Browser DevTools → Network → `/api/generate-blog`: periksa request body tanpa
   membagikan secret, HTTP status, response content type, dan NDJSON event.
3. Browser console berisi `Payload sent to API` dan `AI Generation Error Details`.
4. Vercel → Functions/Runtime Logs: cari `AI article generation failed`,
   `Generating Gemini article with ... attempt ...`, retry delays, dan fallback.
5. HTTP 403 sebelum stream biasanya disabled; HTTP 503 sebelum stream biasanya
   key tidak ada. Sesudah headers flush, baca event NDJSON `error`, bukan hanya
   status HTTP.
6. Gemini 5xx akan dicoba ulang; 400/403 tidak. Periksa model access, kuota,
   rate limits dan pesan provider. Fallback default harus bisa diakses API key.
7. Bila gejala muncul setelah perubahan env, redeploy agar deployment membaca
   variabel baru. Mengubah `.env.local` tidak mengubah Production.
8. Jalankan `node --check` pada JS terkait dan `npm run build`; tes mock status
   503/403 agar retry/fallback dan non-retry behavior tidak regresi.

### Jebakan operasional

- Retry/backoff + fallback bisa menggunakan maksimal 8 request dan 14 detik
  waktu tidur, di luar latency API; Vercel function hanya dikonfigurasi 60 detik.
- Response streaming provider saat ini tidak mengirim token Gemini ke browser
  sampai satu model sukses penuh; jangan menyimpulkan UI incremental berarti
  token Gemini benar-benar tiba saat proses inferensi.
- Fallback model `gemini-3.6-flash` belum dibuktikan tersedia untuk semua akun.
- Mengirim error mentah ke browser berguna untuk debugging, tetapi dapat
  membocorkan detail upstream. Tinjau sanitasi bila pesan memuat data sensitif.
- Vercel Environment Variables berlaku per environment dan per deployment.
  Pastikan mengubah Production/Preview yang benar dan memicu deploy baru.
- Decap CMS memakai backend GitHub dan editorial workflow; konfigurasi CMS biasa
  bukan storage runtime tanpa commit.
- Laporan ini adalah snapshot. Selalu baca kode aktual dan `git status` sebelum
  menerapkan rekomendasi.
