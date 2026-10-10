// lib/pin-templates/bold-type.js
// Style "Bold Type": teks raksasa, foto interior background.

export function renderBoldType({ title, imageDataUrl, category, plan }) {
  const p = plan || {};
  const hook = p.boldHook || {};

  const limitWords = (str, maxWords) => {
    const words = String(str || '').trim().split(/\s+/);
    return words.slice(0, maxWords).join(' ');
  };

  const autoSize = (str, baseSize, maxLen) => {
    const len = String(str || '').length;
    if (len <= maxLen) return baseSize;
    const factor = maxLen / len;
    return Math.max(Math.round(baseSize * factor), 60);
  };

  let angka = String(hook.angka || '10').trim();
  if (angka.length > 3) angka = angka.slice(0, 3);

  const kataKunciRaw = limitWords(hook.kataKunci || 'DEKORASI', 3).toUpperCase();
  const kategoriRaw = limitWords(hook.kategori || 'Ruang Tamu', 4);
  const tahun = String(hook.tahun || '2026').slice(0, 4);

  const angkaSize = autoSize(angka, 200, 3);

  // Kata kunci: split kalau > 12 char atau > 2 kata
  const kataKunciWords = kataKunciRaw.split(' ');
  let kataKunciLines;
  if (kataKunciRaw.length <= 12 && kataKunciWords.length <= 2) {
    kataKunciLines = [kataKunciRaw];
  } else if (kataKunciWords.length >= 2) {
    const mid = Math.ceil(kataKunciWords.length / 2);
    kataKunciLines = [
      kataKunciWords.slice(0, mid).join(' '),
      kataKunciWords.slice(mid).join(' '),
    ];
  } else {
    kataKunciLines = [kataKunciRaw];
  }
  const kataKunciMaxLen = Math.max(...kataKunciLines.map(l => l.length));
  const kataKunciSize = autoSize('x'.repeat(kataKunciMaxLen), 110, 10);

  // Kategori: split kalau >= 3 kata
  const kategoriWords = kategoriRaw.split(' ');
  let kategoriLines;
  if (kategoriWords.length <= 2) {
    kategoriLines = [kategoriRaw];
  } else {
    const mid = Math.ceil(kategoriWords.length / 2);
    kategoriLines = [
      kategoriWords.slice(0, mid).join(' '),
      kategoriWords.slice(mid).join(' '),
    ];
  }
  const kategoriMaxLen = Math.max(...kategoriLines.map(l => l.length));
  const kategoriSize = autoSize('x'.repeat(kategoriMaxLen), 130, 12);

  // ─── POSISI (ADAPTIF) ───
  const angkaTop = 240;
  const kataKunciTop = 420;
  const kataKunciLineHeight = 1.06;  // lineHeight 1 + marginBottom 6px
  const kataKunciHeight = kataKunciLines.length * kataKunciSize * kataKunciLineHeight;
  const kategoriTop = kataKunciTop + kataKunciHeight + 30;  // 30px gap
  const kategoriLineHeight = 1.05;
  const kategoriHeight = kategoriLines.length * kategoriSize * kategoriLineHeight;
  const badgeTop = kategoriTop + kategoriHeight + 30;
  const signatureBottom = 60;

  const ACCENT = '#c2410c';

  return {
    type: 'div',
    props: {
      style: {
        position: 'relative',
        display: 'flex',
        width: '1000px',
        height: '1500px',
        backgroundColor: '#f5f0e8',
        fontFamily: 'Plus Jakarta Sans',
        overflow: 'hidden',
      },
      children: [
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

        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              top: 0, left: 0,
              width: '1000px', height: '1500px',
              background: 'linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.25) 40%, rgba(0,0,0,0.6) 100%)',
              display: 'flex',
            },
            children: '',
          },
        },

        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              top: angkaTop + 'px', left: '0',
              width: '1000px',
              display: 'flex',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: angkaSize + 'px',
              lineHeight: 0.9,
              color: '#ffffff',
              letterSpacing: '-4px',
              textShadow: '0 4px 20px rgba(0,0,0,0.5)',
            },
            children: angka,
          },
        },

        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              top: kataKunciTop + 'px', left: '0',
              width: '1000px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            },
            children: kataKunciLines.map((line, i) => ({
              type: 'div',
              props: {
                key: i,
                style: {
                  display: 'flex',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: kataKunciSize + 'px',
                  lineHeight: 1,
                  letterSpacing: '-2px',
                  color: '#ffffff',
                  textTransform: 'uppercase',
                  textAlign: 'center',
                  textShadow: '0 4px 20px rgba(0,0,0,0.5)',
                  marginBottom: '6px',
                },
                children: line,
              },
            })),
          },
        },

        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              top: kategoriTop + 'px', left: '0',
              width: '1000px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            },
            children: kategoriLines.map((line, i) => ({
              type: 'div',
              props: {
                key: i,
                style: {
                  display: 'flex',
                  justifyContent: 'center',
                  fontFamily: 'Fraunces',
                  fontStyle: 'italic',
                  fontWeight: 700,
                  fontSize: kategoriSize + 'px',
                  lineHeight: kategoriLineHeight,
                  color: '#ffffff',
                  textAlign: 'center',
                  textShadow: '0 4px 20px rgba(0,0,0,0.5)',
                },
                children: line,
              },
            })),
          },
        },

        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              top: badgeTop + 'px',
              left: '0',
              right: '0',
              display: 'flex',
              justifyContent: 'center',
            },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    padding: '14px 40px',
                    backgroundColor: ACCENT,
                    color: '#ffffff',
                    fontSize: '42px',
                    fontWeight: 700,
                    borderRadius: '999px',
                    letterSpacing: '4px',
                    textShadow: '0 2px 10px rgba(0,0,0,0.3)',
                  },
                  children: tahun,
                },
              },
            ],
          },
        },

        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              bottom: signatureBottom + 'px', left: '0',
              width: '1000px',
              display: 'flex',
              justifyContent: 'center',
              fontSize: '24px',
              fontWeight: 600,
              color: '#ffffff',
              letterSpacing: '4px',
              opacity: 0.75,
              textShadow: '0 2px 8px rgba(0,0,0,0.5)',
            },
            children: 'alfeto.vercel.app',
          },
        },
      ],
    },
  };
}
