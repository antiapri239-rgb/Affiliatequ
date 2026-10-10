// lib/pin-templates/warm.js
// Template Pin "Warm" — 1000 x 1500 px
// Foto full-bleed + gradient overlay coklat hangat.
// Headline bold + sub-text minimal + CTA subtle.

export function renderWarm({ title, imageDataUrl, category, plan }) {
  const p = plan || {};
  const cta = p.cta || {};

  // Headline: ambil 3-5 kata dari title
  const cleanTitle = String(title || 'Ruang Tamu Aesthetic')
    .replace(/^\d+\s+/, '')  // buang angka di depan ("5 Ide ...")
    .trim();

  const titleWords = cleanTitle.split(/\s+/);
  const headline = titleWords.slice(0, 4).join(' ').toUpperCase();

  // Sub-text: narasi dari plan atau default
  const subText = cta.narasi || 'Ide dekorasi minimalis untuk rumah hangat';
  const truncatedSubText = subText.length > 60 ? subText.slice(0, 57) + '...' : subText;

  // Warna
  const BROWN_DARK = '#5c3d20';
  const BROWN_MID = '#7a5a3e';
  const CREAM = '#f3ece2';
  const ACCENT_GOLD = '#c5a059';

  return {
    type: 'div',
    props: {
      style: {
        position: 'relative',
        display: 'flex',
        width: '1000px',
        height: '1500px',
        backgroundColor: '#2a1f15',
        fontFamily: 'Plus Jakarta Sans',
        overflow: 'hidden',
      },
      children: [
        // Layer 1: Foto full-bleed
        imageDataUrl
          ? {
              type: 'img',
              props: {
                src: imageDataUrl,
                style: {
                  position: 'absolute',
                  top: 0, left: 0,
                  width: '1000px', height: '1500px',
                  objectFit: 'cover',
                },
              },
            }
          : {
              type: 'div',
              props: {
                style: {
                  position: 'absolute',
                  top: 0, left: 0,
                  width: '1000px', height: '1500px',
                  backgroundColor: '#e8dccb',
                  display: 'flex',
                },
                children: '',
              },
            },

        // Layer 2: Gradient overlay (transparan atas → coklat gelap bawah)
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              top: 0, left: 0,
              width: '1000px', height: '1500px',
              background: `linear-gradient(180deg, rgba(42,31,21,0.15) 0%, rgba(42,31,21,0.05) 30%, rgba(42,31,21,0.55) 60%, rgba(42,31,21,0.92) 85%, rgba(42,31,21,0.98) 100%)`,
              display: 'flex',
            },
            children: '',
          },
        },

        // Layer 3: Konten teks (di bawah)
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              bottom: '80px', left: '0',
              width: '1000px',
              paddingLeft: '70px',
              paddingRight: '70px',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
            },
            children: [
              // Badge kategori
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    padding: '10px 24px',
                    backgroundColor: ACCENT_GOLD,
                    color: BROWN_DARK,
                    fontSize: '22px',
                    fontWeight: 700,
                    letterSpacing: '3px',
                    textTransform: 'uppercase',
                    borderRadius: '999px',
                    marginBottom: '24px',
                  },
                  children: category || 'DEKORASI',
                },
              },

              // Headline bold
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    fontFamily: 'Plus Jakarta Sans',
                    fontWeight: 700,
                    fontSize: '72px',
                    lineHeight: 1.05,
                    letterSpacing: '-1px',
                    color: CREAM,
                    textTransform: 'uppercase',
                    marginBottom: '20px',
                  },
                  children: headline,
                },
              },

              // Divider
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    width: '80px',
                    height: '3px',
                    backgroundColor: ACCENT_GOLD,
                    marginBottom: '20px',
                  },
                },
              },

              // Sub-text
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    fontFamily: 'Plus Jakarta Sans',
                    fontWeight: 400,
                    fontSize: '28px',
                    lineHeight: 1.4,
                    color: CREAM,
                    opacity: 0.85,
                    marginBottom: '32px',
                  },
                  children: truncatedSubText,
                },
              },

              // CTA
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    fontFamily: 'Plus Jakarta Sans',
                    fontWeight: 600,
                    fontSize: '22px',
                    letterSpacing: '3px',
                    color: ACCENT_GOLD,
                    textTransform: 'uppercase',
                  },
                  children: '→ alfeto.vercel.app',
                },
              },
            ],
          },
        },
      ],
    },
  };
}
