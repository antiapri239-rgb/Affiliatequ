// api/lib/pin-templates/_shared/slangs.js
// Library sapaan + mapping gender + helper pilih sapaan.
// Dipakai AI planner untuk nambah sapaan natural di CTA.

export const SLANGS = {
  // Untuk audiens pria (santai)
  pria: ['bro', 'cuy', 'guys', 'kamu'],

  // Untuk audiens wanita (santai)
  wanita: ['bestie', 'gess', 'sis', 'teman', 'kamu'],

  // Untuk audiens netral (semua)
  netral: ['kamu', 'teman', 'kawan'],

  // Untuk konteks formal / bisnis
  formal: ['kamu', 'teman', 'pembaca'],
};

// Mapping kategori -> gender dominan audiens
export const CATEGORY_GENDER = {
  dekorasi: 'wanita',
  home: 'wanita',
  interior: 'wanita',
  lifestyle: 'wanita',
  beauty: 'wanita',
  kecantikan: 'wanita',
  fashion: 'wanita',
  tanaman: 'wanita',
  'home decor': 'wanita',

  teknologi: 'pria',
  gadget: 'pria',
  gaming: 'pria',
  komputer: 'pria',
  otomotif: 'pria',
  diy: 'pria',
  olahraga: 'pria',
  elektronik: 'pria',

  bisnis: 'formal',
  edukasi: 'netral',
  umum: 'netral',
  artikel: 'netral',
  tips: 'netral',
};

// Helper: ambil gender dari kategori
export function getGenderFromCategory(category) {
  if (!category || typeof category !== 'string') return 'netral';
  const key = category.toLowerCase().trim();
  return CATEGORY_GENDER[key] || 'netral';
}

// Helper: pilih sapaan (deterministik dari hash judul, biar konsisten per artikel)
export function pickSlang({ gender, title }) {
  const pool = SLANGS[gender] || SLANGS.netral;

  // Hash sederhana dari judul -> index deterministik
  let hash = 0;
  const str = (title || '') + '|' + (gender || 'netral');
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash; // force 32-bit
  }
  const index = Math.abs(hash) % pool.length;
  return pool[index];
}
