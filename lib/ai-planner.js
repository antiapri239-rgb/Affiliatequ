// api/lib/ai-planner.js
// AI Planner: pakai LLM untuk nentuin layout pin (JSON), bukan generate gambar.
// Cascade: Groq (Tier 1) -> Gemini (Tier 2) -> null (fallback ke preset).

import OpenAI from 'openai';
import { PALETTE_NAMES } from './pin-templates/_shared/palettes.js';
import { SLANGS, getGenderFromCategory, pickSlang } from './pin-templates/_shared/slangs.js';

const PLANNER_SYSTEM_PROMPT = [
  'Kamu adalah desainer Pinterest pin profesional.',
  'Tugasmu: kasih REKOMENDASI LAYOUT dalam format JSON, bukan gambar.',
  '',
  'Canvas: 1000x1500 px (rasio 2:3).',
  '',
  'Gaya yang tersedia:',
  '- warm: warm minimalis organik, pita cokelat hangat di bawah',
  '- poster: split screen (foto + blok warna + teks bold)',
  '- typography: 7 kata jadi hero (script + sans + bold outline)',
  '',
  'Rules:',
  '- Judul > 60 karakter -> fontSize 52, kalau <= 60 -> fontSize 64',
  '- Kategori "DEKORASI" / "HOME" -> palet warm (krem, cokelat)',
  '- Kategori "FASHION" -> palet bold (hitam, terracotta)',
  '- Kalau foto banyak ruang kosong di atas -> taruh textCard di top',
  '- Kalau foto banyak ruang kosong di bawah -> taruh textCard di bottom-center',
  '- Selalu return JSON valid, tanpa markdown, tanpa penjelasan di luar JSON.',
  '',
  'Palet gradient yang TERSEDIA (pilih SATU, sesuai konteks judul & kategori):',
  PALETTE_NAMES.join(', '),
  '',
  'Contoh pemilihan palette:',
  '- Dekorasi/home aesthetic -> warm, terracotta, caramel, sage, rose, cream',
  '- Fashion bold -> sunset, coral, crimson, mono, charcoal',
  '- Teknologi/modern -> ocean, navy, teal, slate, midnight',
  '- Tanaman/organik -> forest, sage, olive, moss, bamboo',
  '- Mewah/premium -> wine, bronze, midnight, charcoal',
  '',
  'Format JSON yang WAJIB kamu return:',
  '{',
  '  "layout": "photo-bottom" | "photo-top" | "photo-full",',
  '  "textCard": {',
  '    "position": "top" | "bottom" | "center",',
  '    "width": 820,',
  '    "padding": 40,',
  '    "bgColor": "rgba(243,236,226,0.92)",',
  '    "textColor": "#5a4030",',
  '    "fontSize": 64,',
  '    "subtitle": "..."',
  '  },',
  '  "image": {',
  '    "maskFrom": 45,',
  '    "maskTo": 80',
  '  },',
  '  "palette": "warm",',
  '  "gradient": {',
  '    "startAt": "55%"',
  '  },',
  '  "audience": {',
  '    "gender": "pria" | "wanita" | "netral",',
  '    "tone": "santai" | "formal" | "aesthetic"',
  '  },',
  '  "ctaCard": {',
  '    "position": "top" | "bottom" | "center",',
  '    "narasi": "<CTA naratif dari judul + ajakan, max 60 char>",',
  '    "action": "<ajakan halus: lanjut baca yuk / yuk simak / intip yuk>"',
  '  },',
  '  "typography": {',
  '    "word1": "<1 kata script, kata kunci utama>",',
  '    "word2": "<1 kata sans>",',
  '    "word3": "<1 kata sans>",',
  '    "word4": "<1 kata sans>",',
  '    "word5": "<1 kata serif italic>",',
  '    "word6": "<1 kata bold>",',
  '    "word7": "<1 kata bold>"',
  '  },',
  '  "boldHook": {',
  '    "angka": "<1-3 karakter, misal: 10, 21+, 15>",',
  '    "kataKunci": "<1-3 kata uppercase, misal: HOME DECOR, MINIMALIST IDEAS>",',
  '    "kategori": "<2-4 kata, misal: Ruang Tamu, Kamar Tidur>",',
  '    "tahun": "2026"',
  '  },',
  '  "boldHook": {',
  '    "angka": "<1-3 karakter, misal: 10, 21+, 15>",',
  '    "kataKunci": "<1-3 kata uppercase, misal: HOME DECOR, MINIMALIST IDEAS>",',
  '    "kategori": "<2-4 kata, misal: Ruang Tamu, Kamar Tidur>",',
  '    "tahun": "2026"',
  '  },',
  '  "keywords": ["tag1", "tag2", "tag3", ...],',
  '}',
  '',
  'Aturan CTA naratif (field "ctaCard.narasi" + "ctaCard.action"):',
  '- WAJIB baca judul artikel, lalu PARAFRASE (jangan copy-paste mentah)',
  '- narasi: deskripsi/topik dari judul, max 55 karakter',
  '- narasi TIDAK boleh pakai verb action: lihat, simak, intip, baca, yuk',
  '- action: ajakan halus di akhir, pilih dari: "lanjut baca yuk", "yuk simak", "intip yuk", "selengkapnya yuk", "baca yuk"',
  '- Bahasa Indonesia santai, kayak ngobrol sama teman',
  '- Contoh: narasi="Cara pilih rak estetik yang tepat", action="lanjut baca yuk"',
  '',
  'Aturan boldHook (field "boldHook" — HANYA untuk style "bold-type"):',
  '- PENTING: field "boldHook" HANYA diisi kalau style = "bold-type".',
  '- Untuk style lain, field "boldHook" HARUS kosong: {}',
  '- angka: 1-3 karakter, angka pilihan (10, 15, 21, 21+, 25)',
  '- kataKunci: 1-3 kata UPPERCASE, hook utama. FOKUS KE BENDA/OBJEK (LAMPU HIAS, WALLPAPER DINDING, RAK MINIMALIS)',
  '- kategori: 2-4 kata, FOKUS KE RUANGAN/STYLE (Ruang Tamu Korea, Kamar Aesthetic, Dapur Minimalis)',
  '- PENTING: kataKunci dan kategori TIDAK BOLEH punya kata yang sama. Contoh SALAH: kataKunci="DEKORASI RUANG" + kategori="Ruang Tamu" (ada kata "Ruang" 2x). Contoh BENAR: kataKunci="LAMPU HIAS" + kategori="Ruang Tamu Korea".',
  '- tahun: selalu "2026"',
  '- Contoh untuk judul "5 Ide Dekorasi Dinding Kamar Aesthetic":',
  '{ "angka": "5", "kataKunci": "WALLPAPER DINDING", "kategori": "Kamar Aesthetic", "tahun": "2026" }',
  '',
  'Aturan boldHook (field "boldHook" — HANYA untuk style "bold-type"):',
  '- PENTING: field "boldHook" HANYA diisi kalau style = "bold-type".',
  '- Untuk style lain, field "boldHook" HARUS kosong: {}',
  '- angka: 1-3 karakter, angka pilihan (10, 15, 21, 21+, 25)',
  '- kataKunci: 1-3 kata UPPERCASE, hook utama. FOKUS KE BENDA/OBJEK (LAMPU HIAS, WALLPAPER DINDING, RAK MINIMALIS)',
  '- kategori: 2-4 kata, FOKUS KE RUANGAN/STYLE (Ruang Tamu Korea, Kamar Aesthetic, Dapur Minimalis)',
  '- PENTING: kataKunci dan kategori TIDAK BOLEH punya kata yang sama. Contoh SALAH: kataKunci="DEKORASI RUANG" + kategori="Ruang Tamu" (ada kata "Ruang" 2x). Contoh BENAR: kataKunci="LAMPU HIAS" + kategori="Ruang Tamu Korea".',
  '- tahun: selalu "2026"',
  '- Contoh untuk judul "5 Ide Dekorasi Dinding Kamar Aesthetic":',
  '{ "angka": "5", "kataKunci": "WALLPAPER DINDING", "kategori": "Kamar Aesthetic", "tahun": "2026" }',
  '',
  'Aturan typography (field "typography" — HANYA untuk style "typography"):',
  '- PENTING: field "typography" HANYA diisi kalau style = "typography".',
  '- Untuk style lain (warm, poster), field "typography" HARUS kosong: {}',
  '- Generate 7 kata yang nyambung ke judul artikel, maksimal 7 kata.',
  '- word1: 1 kata kunci UTAMA (buat font script) — misal "Plant", "Rak", "Lampu"',
  '- word2-4: 3 kata pendukung (buat font sans, sebaris) — misal "Next To Bed"',
  '- word5: 1 kata penghubung (buat font serif italic) — misal "for", "untuk", "biar"',
  '- word6-7: 2 kata utama (buat font bold GEDE) — misal "Calm Sleep", "Rapi Estetik"',
  '- Boleh ambil padanan kata di luar judul, yang penting NYAMBUNG & user paham',
  '- Kalau style BUKAN "typography", field ini boleh kosong {} atau null',
  '',
  'Contoh typography dari judul "5 Ide Dekorasi Kamar Aesthetic":',
  '{ "word1": "Kamar", "word2": "Jadi", "word3": "Lebih", "word4": "Estetik", "word5": "biar", "word6": "Cozy", "word7": "Maksimal" }',
  '',
  'Aturan keywords (field "keywords"):',
  '- Generate HANYA 3-5 tag per pin (JANGAN lebih, hindari spam)',
  '- Campuran: 1-2 spesifik (produk), 1-2 medium (gaya/room), 1 broad (topik)',
  '- Contoh: ["rak ambalan", "dekorasi kamar", "minimalis"]',
  '- Format: array of strings, lowercase, no # hashtag',
  '- WAJIB searchable di Pinterest (kata kunci yang orang beneran cari)',
  '',
  'Aturan audience (field "audience"):',
  '- Analisa judul + kategori untuk tentukan gender audiens',
  '- Kata kunci wanita: aesthetic, dekorasi, kamar, cozy, bunga, makeup, skincare, dress, hijab',
  '- Kata kunci pria: gaming, PC, alat, teknik, bor, mesin, otomotif, gadget',
  '- Kalau ambigu atau umum -> "netral"',
  '- Kalau judul formal (panduan, cara memilih) -> tone "formal"',
  '- Kalau judul aesthetic (esthetic, cozy, dreamy) -> tone "aesthetic"',
  '- Sisanya -> tone "santai"',
].join('\n');

// ---------- TIER 1: GROQ ----------
async function callGroq({ title, category, style }) {
  const client = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1',
  });

  const userPrompt = 'Buat layout Pinterest pin dengan data berikut:\nJudul: "' + title + '"\nKategori: "' + category + '"\nStyle: "' + style + '"\n\nReturn JSON valid.';

  const res = await client.chat.completions.create({
    model: 'openai/gpt-oss-120b',
    messages: [
      { role: 'system', content: PLANNER_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3,
  });

  const parsed = JSON.parse(res.choices[0].message.content);
  if (!parsed.palette || !PALETTE_NAMES.includes(parsed.palette)) {
    parsed.palette = 'warm';
  }
  return parsed;
}

// ---------- TIER 2: GEMINI ----------
async function callGemini({ title, category, style }) {
  const client = new OpenAI({
    apiKey: process.env.GEMINI_API_KEY,
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai',
  });

  const userPrompt = 'Buat layout Pinterest pin dengan data berikut:\nJudul: "' + title + '"\nKategori: "' + category + '"\nStyle: "' + style + '"\n\nReturn JSON valid.';

  const res = await client.chat.completions.create({
    model: 'gemini-2.5-flash-lite',
    messages: [
      { role: 'system', content: PLANNER_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3,
  });

  const parsed = JSON.parse(res.choices[0].message.content);
  if (!parsed.palette || !PALETTE_NAMES.includes(parsed.palette)) {
    parsed.palette = 'warm';
  }
  return parsed;
}

// ---------- ORCHESTRATOR ----------
export async function planLayout({ title, category, style }) {
  if (!process.env.GROQ_API_KEY && !process.env.GEMINI_API_KEY) {
    console.warn('[ai-planner] Tidak ada API key, skip AI');
    return null;
  }

  // Inject sapaan ke plan (setelah plan dari AI)
  function injectSlang(plan) {
    if (!plan || !plan.ctaCard) return plan;

    // Tentukan gender: prioritas dari AI, fallback ke kategori
    let gender = plan.audience && plan.audience.gender;
    if (!gender || gender === 'netral') {
      gender = getGenderFromCategory(category);
    }

    // Pilih sapaan deterministik
    const sapaan = pickSlang({ gender, title });

    // Format final: narasi saja (tanpa action)
    const narasi = plan.ctaCard.narasi || '';
    plan.ctaCard.fullText = narasi;

    return plan;
  }

  if (process.env.GROQ_API_KEY) {
    try {
      console.log('[ai-planner] Tier 1: Groq');
      const plan = await callGroq({ title, category, style });
      console.log('[ai-planner] Groq sukses');
      return injectSlang(plan);
    } catch (err) {
      console.warn('[ai-planner] Groq gagal: ' + err.message);
    }
  }

  if (process.env.GEMINI_API_KEY) {
    try {
      console.log('[ai-planner] Tier 2: Gemini');
      const plan = await callGemini({ title, category, style });
      console.log('[ai-planner] Gemini sukses');
      return injectSlang(plan);
    } catch (err) {
      console.warn('[ai-planner] Gemini gagal: ' + err.message);
    }
  }

  console.warn('[ai-planner] Semua provider gagal, fallback ke preset');
  return null;
}
