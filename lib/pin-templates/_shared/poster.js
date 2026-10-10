// lib/pin-templates/_shared/poster.js
// Layout "Poster" v2: Split Screen (atas-bawah).
// Atas 65%: foto + frame putih tipis.
// Bawah 35%: blok warna solid + teks bold (badge, judul, narasi, signature).

import { resolvePalette } from './palettes.js';

export function posterLayout({ title, imageDataUrl, category, plan }) {
  const p = plan || {};
  const palette = resolvePalette(p.palette || 'warm');
  const ctaCard = p.ctaCard || {};

  const judul = (title || '').toUpperCase();
  const narasi = ctaCard.fullText || ctaCard.narasi || 'Baca artikelnya, selengkapnya yuk';
  const kategori = (category || 'DEKORASI').toUpperCase();

  const accentColor = palette.accent || '#f3ece2';
  const bgColor = palette.to || '#7a5a3e';

  // Auto-shrink judul kalau kepanjangan
  const judulSize = judul.length > 70 ? 54 : judul.length > 45 ? 62 : 72;

  return {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        flexDirection: 'column',
        width: '1000px',
        height: '1500px',
        backgroundColor: bgColor,
        fontFamily: 'Plus Jakarta Sans',
        overflow: 'hidden',
      },
      children: [
        // ===== BAGIAN ATAS (65% = 975px): FOTO + FRAME =====
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '1000px',
              height: '975px',
              backgroundColor: bgColor,
              padding: '24px',
              boxSizing: 'border-box',
            },
            children: imageDataUrl
              ? {
                  type: 'img',
                  props: {
                    src: imageDataUrl,
                    style: {
                      width: '952px',
                      height: '927px',
                      objectFit: 'cover',
                      border: '12px solid #ffffff',
                      boxSizing: 'border-box',
                    },
                  },
                }
              : {
                  type: 'div',
                  props: {
                    style: {
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '952px',
                      height: '927px',
                      backgroundColor: '#e8dccb',
                      color: '#a8977e',
                      fontSize: '32px',
                      border: '12px solid #ffffff',
                      boxSizing: 'border-box',
                    },
                    children: 'Foto tidak tersedia',
                  },
                },
          },
        },

        // ===== BAGIAN BAWAH (35% = 525px): BLOK WARNA + TEKS =====
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              width: '1000px',
              height: '525px',
              backgroundColor: bgColor,
              paddingLeft: '70px',
              paddingRight: '70px',
              paddingTop: '45px',
              paddingBottom: '45px',
              boxSizing: 'border-box',
            },
            children: [
              // Badge kategori
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    padding: '10px 26px',
                    backgroundColor: accentColor,
                    color: bgColor,
                    fontSize: '22px',
                    fontWeight: 700,
                    borderRadius: '999px',
                    letterSpacing: '2px',
                    marginBottom: '24px',
                  },
                  children: kategori,
                },
              },

              // Judul GEDE
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    fontFamily: 'Plus Jakarta Sans',
                    fontWeight: 700,
                    fontSize: judulSize + 'px',
                    lineHeight: 1.15,
                    color: '#ffffff',
                    textAlign: 'center',
                    letterSpacing: '0.5px',
                    marginBottom: '24px',
                  },
                  children: judul,
                },
              },

              // Divider
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    width: '100px',
                    height: '4px',
                    backgroundColor: accentColor,
                    borderRadius: '999px',
                    marginBottom: '24px',
                  },
                },
              },

              // Narasi
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    fontSize: '34px',
                    fontWeight: 600,
                    lineHeight: 1.35,
                    color: accentColor,
                    textAlign: 'center',
                  },
                  children: narasi,
                },
              },
            ],
          },
        },
      ],
    },
  };
}
