// api/lib/pin-templates/_shared/presets.js
// Layout preset per style. Dipakai kalau AI Planner gagal / return null.

export const PRESETS = {
  warm: {
    layout: 'photo-bottom',
    textCard: {
      position: 'top',
      width: 820,
      padding: 40,
      theme: 'warm',
      fontSize: 64,
      subtitle: 'Hemat tempat di meja, tampil lebih rapi & estetik setiap hari.',
    },
    image: { maskFrom: 45, maskTo: 80 },
    gradient: { from: 'transparent', to: '#7a5a3e', startAt: '55%' },
    cta: { text: 'alfeto.vercel.app', bgColor: '#7a5a3e', textColor: '#f3ece2' },
  },

  poster: {
    layout: 'photo-full',
    ctaCard: {
      narasi: 'Baca artikelnya, selengkapnya yuk',
      fontSize: 38,
    },
    palette: 'warm',
    image: { maskFrom: 0, maskTo: 0 },
  },

  typography: {
    layout: 'typography',
    palette: 'sage',
    typography: {
      word1: 'Kamar',
      word2: 'Jadi',
      word3: 'Lebih',
      word4: 'Estetik',
      word5: 'biar',
      word6: 'Cozy',
      word7: 'Maksimal',
    },
  },

  'bold-type': {
    layout: 'bold-type',
    palette: 'warm',
    boldHook: {
      angka: '10',
      kataKunci: 'DEKORASI',
      kategori: 'Ruang Tamu',
      tahun: '2026',
    },
  },
};

// Ambil preset berdasarkan style, fallback ke warm
export function getPreset(style) {
  return PRESETS[style] || PRESETS.warm;
}
