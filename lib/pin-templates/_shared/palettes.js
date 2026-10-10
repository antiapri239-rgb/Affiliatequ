// api/lib/pin-templates/_shared/palettes.js
// 35 palet gradient. AI pilih nama palet, compose resolve ke hex.

export const PALETTES = {
  // ============ WARM (home/dekorasi) ============
  warm:       { from: 'transparent', to: '#7a5a3e', accent: '#f3ece2' },
  terracotta: { from: 'transparent', to: '#c2410c', accent: '#ffffff' },
  sunset:     { from: 'transparent', to: '#ea580c', accent: '#fff7ed' },
  caramel:    { from: 'transparent', to: '#a16207', accent: '#fef3c7' },
  rust:       { from: 'transparent', to: '#9a3412', accent: '#fed7aa' },
  amber:      { from: 'transparent', to: '#d97706', accent: '#fffbeb' },

  // ============ COOL (teknologi/modern) ============
  ocean:      { from: 'transparent', to: '#1e3a5f', accent: '#dbeafe' },
  navy:       { from: 'transparent', to: '#1e293b', accent: '#e2e8f0' },
  teal:       { from: 'transparent', to: '#0f766e', accent: '#ccfbf1' },
  slate:      { from: 'transparent', to: '#334155', accent: '#f1f5f9' },
  ice:        { from: 'transparent', to: '#0e7490', accent: '#cffafe' },

  // ============ NATURE (organik/tanaman) ============
  forest:     { from: 'transparent', to: '#2d4a3e', accent: '#d1fae5' },
  sage:       { from: 'transparent', to: '#6b7f5e', accent: '#f0f4e8' },
  olive:      { from: 'transparent', to: '#556b2f', accent: '#f7f5d3' },
  moss:       { from: 'transparent', to: '#4a5d3a', accent: '#e5ebd9' },
  bamboo:     { from: 'transparent', to: '#7a8b5c', accent: '#f5f7e8' },

  // ============ PASTEL (aesthetic/lembut) ============
  lavender:   { from: 'transparent', to: '#6b5b95', accent: '#f3e8ff' },
  rose:       { from: 'transparent', to: '#a06b8a', accent: '#fce7f3' },
  peach:      { from: 'transparent', to: '#d97757', accent: '#ffe4d6' },
  mint:       { from: 'transparent', to: '#6ba89a', accent: '#d1fae5' },
  sky:        { from: 'transparent', to: '#7a9cc6', accent: '#e0f2fe' },

  // ============ DARK / PREMIUM (mewah) ============
  mono:       { from: 'transparent', to: '#1c1917', accent: '#fafaf9' },
  charcoal:   { from: 'transparent', to: '#292524', accent: '#f5f5f4' },
  midnight:   { from: 'transparent', to: '#0f172a', accent: '#e2e8f0' },
  wine:       { from: 'transparent', to: '#7f1d1d', accent: '#fee2e2' },
  bronze:     { from: 'transparent', to: '#78350f', accent: '#fef3c7' },

  // ============ VIBRANT (bold/energik) ============
  fuchsia:    { from: 'transparent', to: '#a21caf', accent: '#fae8ff' },
  coral:      { from: 'transparent', to: '#f43f5e', accent: '#ffe4e6' },
  mango:      { from: 'transparent', to: '#ea580c', accent: '#ffedd5' },
  turquoise:  { from: 'transparent', to: '#0891b2', accent: '#cffafe' },
  crimson:    { from: 'transparent', to: '#dc2626', accent: '#fee2e2' },

  // ============ NEUTRAL (minimalis) ============
  cream:      { from: 'transparent', to: '#e7e5e4', accent: '#292524' },
  sand:       { from: 'transparent', to: '#d6cbb8', accent: '#44403c' },
  taupe:      { from: 'transparent', to: '#8b7d6b', accent: '#faf8f3' },
  stone:      { from: 'transparent', to: '#78716c', accent: '#fafaf9' },
};

// Resolve nama palet -> object hex. Fallback ke warm kalau nggak ketemu.
export function resolvePalette(name) {
  if (!name || typeof name !== 'string') return PALETTES.warm;
  return PALETTES[name] || PALETTES.warm;
}

// List nama palet (buat validasi & prompt AI)
export const PALETTE_NAMES = Object.keys(PALETTES);
