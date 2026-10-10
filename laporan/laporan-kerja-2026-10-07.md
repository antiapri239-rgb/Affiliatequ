# Laporan Pekerjaan — 7 Oktober 2026

## Ringkasan

Fokus pekerjaan hari ini adalah mendiagnosis dan memperbaiki generator artikel AI
di CMS Decap, termasuk konfigurasi lokal/Vercel, streaming respons Gemini,
penanganan error, dan pembaruan model Gemini.

## Pekerjaan yang dilakukan

### Diagnosis konfigurasi dan error generator

- Memeriksa alur tombol **Generate Artikel AI**, endpoint `/api/generate-blog`,
  provider Gemini, dan petunjuk setup di README.
- Menemukan file environment lokal awalnya bernama `.env.local.`; file tersebut
  dinormalisasi menjadi `.env.local`.
- Menguji konfigurasi Gemini yang tersedia. API menolak key yang saat itu
  terpasang sebagai tidak valid. Nilai key tidak dicatat dalam laporan.
- Menjelaskan perbedaan konfigurasi lokal (`.env.local`) dan environment
  Production/Preview di Vercel, serta kebutuhan menjalankan API lokal melalui
  `vercel dev`.
- Meninjau log dan screenshot error. Error Gemini yang ditemukan berbeda-beda:
  model 3.8 sempat mengembalikan 503 karena kapasitas tinggi, sedangkan
  `gemini-1.5-flash` dan kemudian `gemini-2.5-flash` dikembalikan sebagai model
  yang tidak tersedia untuk request/akun tersebut.

### Streaming dan penanganan error

- Mengubah provider Gemini agar menggunakan `generateContentStream` dan
  meneruskan bagian teks artikel selama proses generasi.
- Mengubah endpoint Vercel menjadi stream NDJSON berisi event artikel,
  metadata, selesai, atau error; mengatur batas durasi function menjadi
  60 detik.
- Memperbarui widget Decap CMS untuk membaca stream bertahap, mengisi artikel
  secara real-time, dan tetap mengisi deskripsi serta tags setelah proses
  selesai. Isi artikel sebelumnya dipulihkan bila stream gagal di tengah jalan.
- Menambahkan log payload dan detail error ke browser console. Pesan error dari
  backend juga ditampilkan di CMS.
- Memperbarui endpoint supaya pesan error server tidak selalu tertutup oleh
  pesan generik.
- Menambahkan dokumentasi contoh `fetch` dengan `ReadableStream` pada README.

### Pembaruan model Gemini

- Mengganti model dari `gemini-3.8-flash` ke `gemini-1.5-flash` atas permintaan
  perubahan streaming, lalu menggantinya ke `gemini-2.5-flash` setelah model
  1.5 tidak ditemukan.
- Setelah screenshot menunjukkan 2.5 tidak tersedia untuk akun tersebut dan
  API menyarankan `gemini-3.8-flash`, konfigurasi akhir dikembalikan ke
  `gemini-3.8-flash`.
- Menyesuaikan README dan `.env.example` dengan model akhir tersebut.

## Validasi

- Pemeriksaan sintaks JavaScript berhasil.
- Pengujian parsing stream Gemini dengan potongan respons terpisah berhasil.
- `npm run build` berhasil setelah perubahan streaming dan setelah pembaruan
  model akhir.
- Belum ada konfirmasi dari pengujian langsung bahwa generasi berhasil pada
  deployment Vercel setelah perubahan model terakhir.

## Commit dan push

Commit terkait yang tercatat pada 7 Oktober:

- `ca1aded` — `Stream Gemini article generation`
- `9f39c0b` — `Log AI article generation errors`
- `fb95a1f` — `Refine AI article stream errors`
- `0a3e67c` — `Use supported Gemini Flash model`
- `2103846` — `Use recommended Gemini Flash model`

Push sempat gagal karena kredensial GitHub tidak tersedia pada environment
kerja ini. Pemeriksaan terakhir menunjukkan branch `main` satu commit di depan
`origin/main`; commit paling baru adalah `2103846`. Push perlu dilakukan dari
terminal yang sudah terautentikasi.

## File utama yang dikerjakan

- `api/generate-blog.js`
- `api/lib/ai-provider.js`
- `api/lib/providers/gemini.js`
- `public/admin/generate-blog-widget.js`
- `vercel.json`
- `README.md`
- `.env.example`
