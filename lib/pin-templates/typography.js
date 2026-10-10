// lib/pin-templates/typography.js
// Style "Typography Hero": 7 kata jadi bintang utama.
// Foto background blur, teks hijau tua dengan outline putih.
// Kanvas 1080x1920 (9:16 HD).

export function renderTypography({ title, imageDataUrl, category, plan }) {
  const p = plan || {};
  const typo = p.typography || {};

  // Fallback kalau AI nggak generate typography
  const word1 = typo.word1 || 'Rumah';
  const word2 = typo.word2 || 'Jadi';
  const word3 = typo.word3 || 'Lebih';
  const word4 = typo.word4 || 'Estetik';
  const word5 = typo.word5 || 'biar';
  const word6 = typo.word6 || 'Cozy';
  const word7 = typo.word7 || 'Maksimal';

  const TEXT_COLOR = '#1a3a2e';
  const OUTLINE = '3px 3px 0 #ffffff, -3px 3px 0 #ffffff, 3px -3px 0 #ffffff, -3px -3px 0 #ffffff';

  return {
    type: 'div',
    props: {
      style: {
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        width: '1080px',
        height: '1920px',
        backgroundColor: '#f5f0e8',
        fontFamily: 'Plus Jakarta Sans',
        overflow: 'hidden',
      },
      children: [
        // Layer 1: Foto full-bleed + blur
        imageDataUrl
          ? {
              type: 'img',
              props: {
                src: imageDataUrl,
                style: {
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '1080px',
                  height: '1920px',
                  objectFit: 'cover',
                },
              },
            }
          : {
              type: 'div',
              props: {
                style: {
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '1080px',
                  height: '1920px',
                  backgroundColor: '#e8dccb',
                },
              },
            },

        // Layer 2: Overlay soft putih (biar teks kebaca)
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              top: 0,
              left: 0,
              width: '1080px',
              height: '1100px',
              background: 'linear-gradient(180deg, rgba(245,240,232,0.45) 0%, rgba(245,240,232,0.25) 60%, rgba(245,240,232,0) 100%)',
            },
          },
        },

        // Layer 3: Konten teks (7 kata)
        {
          type: 'div',
          props: {
            style: {
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '1080px',
              paddingTop: '180px',
              paddingLeft: '80px',
              paddingRight: '80px',
              boxSizing: 'border-box',
            },
            children: [
              // WORD 1 — Script (Fraunces Italic)
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    fontFamily: 'Fraunces',
                    fontStyle: 'italic',
                    fontWeight: 700,
                    fontSize: '190px',
                    lineHeight: 1,
                    color: TEXT_COLOR,
                    textAlign: 'center',
                    marginBottom: '20px',
                  },
                  children: word1,
                },
              },

              // WORD 2-4 — Sans (sebaris)
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignItems: 'baseline',
                    gap: '24px',
                    marginBottom: '30px',
                  },
                  children: [word2, word3, word4].map((w, i) => ({
                    type: 'div',
                    props: {
                      key: i,
                      style: {
                        display: 'flex',
                        fontFamily: 'Plus Jakarta Sans',
                        fontWeight: 600,
                        fontSize: '56px',
                        letterSpacing: '6px',
                        color: TEXT_COLOR,
                        textTransform: 'uppercase',
                      },
                      children: w,
                    },
                  })),
                },
              },

              // WORD 5 — Serif Italic (diapit garis)
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '20px',
                    marginBottom: '40px',
                  },
                  children: [
                    { type: 'div', props: { style: { display: 'flex', width: '80px', height: '3px', backgroundColor: TEXT_COLOR } } },
                    {
                      type: 'div',
                      props: {
                        style: {
                          display: 'flex',
                          fontFamily: 'Fraunces',
                          fontStyle: 'italic',
                          fontWeight: 700,
                          fontSize: '62px',
                          color: TEXT_COLOR,
                        },
                        children: word5,
                      },
                    },
                    { type: 'div', props: { style: { display: 'flex', width: '80px', height: '3px', backgroundColor: TEXT_COLOR } } },
                  ],
                },
              },

              // WORD 6 — Bold GEDE (outline putih)
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    fontFamily: 'Plus Jakarta Sans',
                    fontWeight: 700,
                    fontSize: '160px',
                    lineHeight: 1,
                    letterSpacing: '-2px',
                    color: TEXT_COLOR,
                    textTransform: 'uppercase',
                    textShadow: OUTLINE,
                    textAlign: 'center',
                    marginBottom: '10px',
                  },
                  children: word6,
                },
              },

              // WORD 7 — Bold GEDE (outline putih)
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    fontFamily: 'Plus Jakarta Sans',
                    fontWeight: 700,
                    fontSize: '160px',
                    lineHeight: 1,
                    letterSpacing: '-2px',
                    color: TEXT_COLOR,
                    textTransform: 'uppercase',
                    textShadow: OUTLINE,
                    textAlign: 'center',
                  },
                  children: word7,
                },
              },
            ],
          },
        },
      ],
    },
  };
}
