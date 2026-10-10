// lib/pin-templates/before-after.js
// Style "Before/After Split": 2 foto vertikal (before atas, after bawah).
// Transformation story — angka/prominent text di overlay after.

export function renderBeforeAfter({ title, beforeImageUrl, afterImageUrl, category, plan }) {
  const p = plan || {};
  const hook = p.beforeAfterHook || {};

  // Context text
  const context = hook.context || (category ? `${category} Makeover` : 'Room Makeover');
  const subContext = hook.subContext || String(title || '').replace(/^\d+\s+/, '').slice(0, 50);

  // Labels
  const beforeLabel = hook.beforeLabel || 'BEFORE';
  const afterLabel = hook.afterLabel || 'AFTER';

  // Warna
  const BROWN_DARK = '#5c3d20';
  const CREAM = '#f3ece2';
  const ACCENT_GOLD = '#c5a059';
  const LABEL_BG = 'rgba(0, 0, 0, 0.75)';

  // Split: before 45%, after 55% (after lebih besar, karena lebih penting)
  const beforeHeight = 675;   // 45% dari 1500
  const afterHeight = 825;    // 55% dari 1500

  return {
    type: 'div',
    props: {
      style: {
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        width: '1000px',
        height: '1500px',
        backgroundColor: '#2a1f15',
        fontFamily: 'Plus Jakarta Sans',
        overflow: 'hidden',
      },
      children: [
        // === BLOK ATAS: FOTO BEFORE ===
        {
          type: 'div',
          props: {
            style: {
              position: 'relative',
              display: 'flex',
              width: '1000px',
              height: beforeHeight + 'px',
              overflow: 'hidden',
            },
            children: [
              beforeImageUrl
                ? {
                    type: 'img',
                    props: {
                      src: beforeImageUrl,
                      style: {
                        position: 'absolute',
                        top: 0, left: 0,
                        width: '1000px', height: beforeHeight + 'px',
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
                        width: '1000px', height: beforeHeight + 'px',
                        backgroundColor: '#d4c5b0',
                        display: 'flex',
                      },
                      children: '',
                    },
                  },

              // Badge BEFORE
              {
                type: 'div',
                props: {
                  style: {
                    position: 'absolute',
                    top: '32px', left: '32px',
                    display: 'flex',
                    padding: '12px 28px',
                    backgroundColor: LABEL_BG,
                    color: '#ffffff',
                    fontSize: '24px',
                    fontWeight: 700,
                    letterSpacing: '4px',
                    borderRadius: '6px',
                    zIndex: 10,
                  },
                  children: beforeLabel,
                },
              },
            ],
          },
        },

        // === DIVIDER GOLD ===
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              width: '1000px',
              height: '6px',
              backgroundColor: ACCENT_GOLD,
              zIndex: 20,
            },
          },
        },

        // === BLOK BAWAH: FOTO AFTER + OVERLAY TEXT ===
        {
          type: 'div',
          props: {
            style: {
              position: 'relative',
              display: 'flex',
              width: '1000px',
              height: afterHeight + 'px',
              overflow: 'hidden',
            },
            children: [
              afterImageUrl
                ? {
                    type: 'img',
                    props: {
                      src: afterImageUrl,
                      style: {
                        position: 'absolute',
                        top: 0, left: 0,
                        width: '1000px', height: afterHeight + 'px',
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
                        width: '1000px', height: afterHeight + 'px',
                        backgroundColor: '#e8dccb',
                        display: 'flex',
                      },
                      children: '',
                    },
                  },

              // Gradient overlay di after (buat text readability)
              {
                type: 'div',
                props: {
                  style: {
                    position: 'absolute',
                    top: 0, left: 0,
                    width: '1000px', height: afterHeight + 'px',
                    background: 'linear-gradient(180deg, rgba(42,31,21,0.05) 0%, rgba(42,31,21,0.15) 40%, rgba(42,31,21,0.85) 100%)',
                    display: 'flex',
                  },
                  children: '',
                },
              },

              // Badge AFTER
              {
                type: 'div',
                props: {
                  style: {
                    position: 'absolute',
                    top: '32px', left: '32px',
                    display: 'flex',
                    padding: '12px 28px',
                    backgroundColor: ACCENT_GOLD,
                    color: BROWN_DARK,
                    fontSize: '24px',
                    fontWeight: 700,
                    letterSpacing: '4px',
                    borderRadius: '6px',
                    zIndex: 10,
                  },
                  children: afterLabel,
                },
              },

              // Konten teks di bawah after
              {
                type: 'div',
                props: {
                  style: {
                    position: 'absolute',
                    bottom: '60px', left: '0',
                    width: '1000px',
                    paddingLeft: '60px',
                    paddingRight: '60px',
                    boxSizing: 'border-box',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    zIndex: 10,
                  },
                  children: [
                    // Context text
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
                          marginBottom: '14px',
                          textShadow: '0 4px 16px rgba(0,0,0,0.6)',
                        },
                        children: context,
                      },
                    },

                    // Divider gold
                    {
                      type: 'div',
                      props: {
                        style: {
                          display: 'flex',
                          width: '60px',
                          height: '3px',
                          backgroundColor: ACCENT_GOLD,
                          marginBottom: '16px',
                        },
                      },
                    },

                    // Sub-context
                    {
                      type: 'div',
                      props: {
                        style: {
                          display: 'flex',
                          fontFamily: 'Fraunces',
                          fontStyle: 'italic',
                          fontWeight: 400,
                          fontSize: '30px',
                          lineHeight: 1.3,
                          color: CREAM,
                          opacity: 0.9,
                          marginBottom: '24px',
                          textShadow: '0 2px 10px rgba(0,0,0,0.6)',
                        },
                        children: subContext,
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
                          textShadow: '0 2px 8px rgba(0,0,0,0.5)',
                        },
                        children: '→ alfeto.vercel.app',
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    },
  };
}
