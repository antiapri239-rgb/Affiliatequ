// lib/pin-templates/listicle.js
// Style "Listicle": angka gede + kata kunci + sub-text. Full-bleed foto.

export function renderListicle({ title, imageDataUrl, category, plan }) {
  const p = plan || {};
  const hook = p.listicleHook || {};

  // Extract angka dari judul (kalau ada) atau dari plan
  const angkaFromTitle = String(title || '').match(/^(\d+)/)?.[1];
  const angka = hook.angka || angkaFromTitle || '5';
  const angkaSize = angka.length > 2 ? 140 : 180;

  // Kata kunci: 3-4 kata
  const kataKunci = hook.kataKunci || 'DEKORASI RUANG TAMU';
  const kataKunciWords = kataKunci.split(/\s+/).slice(0, 4);
  const kataKunciClean = kataKunciWords.join(' ').toUpperCase();

  // Sub-text: dari judul, buang angka depan
  const subText = hook.subText || String(title || '').replace(/^\d+\s+/, '').replace(/^(ide|inspirasi|trik|cara)\s+/i, '');
  const truncatedSubText = subText.length > 60 ? subText.slice(0, 57) + '...' : subText;

  // Warna
  const BROWN_DARK = '#5c3d20';
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
        // Layer 1: Foto
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

        // Layer 2: Gradient overlay (lebih pekat di bawah)
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              top: 0, left: 0,
              width: '1000px', height: '1500px',
              background: 'linear-gradient(180deg, rgba(42,31,21,0.10) 0%, rgba(42,31,21,0.20) 35%, rgba(42,31,21,0.75) 65%, rgba(42,31,21,0.95) 100%)',
              display: 'flex',
            },
            children: '',
          },
        },

        // Layer 3: Konten
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
              // Badge kategori (kecil, di atas angka)
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    padding: '8px 20px',
                    backgroundColor: ACCENT_GOLD,
                    color: BROWN_DARK,
                    fontSize: '20px',
                    fontWeight: 700,
                    letterSpacing: '3px',
                    textTransform: 'uppercase',
                    borderRadius: '999px',
                    marginBottom: '20px',
                  },
                  children: category || 'HOME DECOR',
                },
              },

              // ANGKA GEDE + "IDE"
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'baseline',
                    gap: '16px',
                    marginBottom: '16px',
                  },
                  children: [
                    {
                      type: 'div',
                      props: {
                        style: {
                          display: 'flex',
                          fontFamily: 'Plus Jakarta Sans',
                          fontWeight: 700,
                          fontSize: angkaSize + 'px',
                          lineHeight: 0.9,
                          color: CREAM,
                          letterSpacing: '-6px',
                        },
                        children: angka,
                      },
                    },
                    {
                      type: 'div',
                      props: {
                        style: {
                          display: 'flex',
                          fontFamily: 'Fraunces',
                          fontStyle: 'italic',
                          fontWeight: 700,
                          fontSize: '72px',
                          lineHeight: 1,
                          color: ACCENT_GOLD,
                        },
                        children: 'Ide',
                      },
                    },
                  ],
                },
              },

              // KATA KUNCI (2-4 kata, uppercase)
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    fontFamily: 'Plus Jakarta Sans',
                    fontWeight: 700,
                    fontSize: '56px',
                    lineHeight: 1.1,
                    letterSpacing: '-1px',
                    color: CREAM,
                    textTransform: 'uppercase',
                    marginBottom: '20px',
                  },
                  children: kataKunciClean,
                },
              },

              // Divider gold
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

              // Sub-text (italic, dari judul)
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    fontFamily: 'Fraunces',
                    fontStyle: 'italic',
                    fontWeight: 400,
                    fontSize: '34px',
                    lineHeight: 1.3,
                    color: CREAM,
                    opacity: 0.9,
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
