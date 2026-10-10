// api/lib/pin-templates/_shared/layers.js
// Helper layer reusable buat semua template pin.
// Semua fungsi return object Satori-compatible (bukan JSX).

// Foto full-screen dengan mask gradient (fade out ke bawah)
export function fullscreenImage(imageDataUrl, opts) {
  const maskFrom = (opts && opts.maskFrom) || 40;
  const maskTo = (opts && opts.maskTo) || 75;
  const maskGradient = 'linear-gradient(180deg, black 0%, black ' + maskFrom + '%, transparent ' + maskTo + '%)';

  if (!imageDataUrl) {
    return {
      type: 'div',
      props: {
        style: {
          position: 'absolute',
          top: 0,
          left: 0,
          width: '1000px',
          height: '1500px',
          backgroundColor: '#e8dccb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#a8977e',
          fontSize: '32px',
        },
        children: 'Foto tidak tersedia',
      },
    };
  }

  return {
    type: 'img',
    props: {
      src: imageDataUrl,
      style: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '1000px',
        height: '1500px',
        objectFit: 'cover',
        maskImage: maskGradient,
        WebkitMaskImage: maskGradient,
      },
    },
  };
}

// Gradient overlay di bagian bawah
export function gradientOverlay(opts) {
  const from = (opts && opts.from) || 'transparent';
  const to = (opts && opts.to) || '#7a5a3e';
  const startAt = (opts && opts.startAt) || '40%';

  return {
    type: 'div',
    props: {
      style: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: '1000px',
        height: '600px',
        background: 'linear-gradient(180deg, ' + from + ' 0%, ' + to + ' ' + startAt + ', ' + to + ' 100%)',
      },
    },
  };
}

// Kartu teks overlay (judul + subtitle) dengan tema
export function textCard(opts) {
  const title = opts.title || '';
  const subtitle = opts.subtitle || '';
  const position = opts.position || 'top';
  const theme = opts.theme || 'warm';
  const width = opts.width || 820;
  const padding = opts.padding || 40;
  const fontSize = opts.fontSize || 56;

  const themes = {
    warm: { bg: 'rgba(243,236,226,0.92)', color: '#5a4030', subColor: '#8a7660' },
    bold: { bg: 'rgba(0,0,0,0.85)', color: '#ffffff', subColor: '#cccccc' },
    light: { bg: 'rgba(255,255,255,0.9)', color: '#111111', subColor: '#666666' },
  };
  const t = themes[theme] || themes.warm;

  const positions = {
    top: { top: '100px' },
    bottom: { bottom: '200px' },
    center: { top: '450px' },
  };
  const pos = positions[position] || positions.top;

  const children = [
    {
      type: 'div',
      props: {
        style: {
          fontSize: fontSize + 'px',
          fontWeight: 700,
          color: t.color,
          lineHeight: 1.2,
          textTransform: 'uppercase',
          letterSpacing: '1px',
        },
        children: title,
      },
    },
  ];

  if (subtitle) {
    children.push({
      type: 'div',
      props: {
        style: {
          fontSize: '28px',
          color: t.subColor,
          marginTop: '20px',
          lineHeight: 1.4,
        },
        children: subtitle,
      },
    });
  }

  return {
    type: 'div',
    props: {
      style: {
        position: 'absolute',
        left: '90px',
        width: width + 'px',
        padding: padding + 'px',
        backgroundColor: t.bg,
        borderRadius: '20px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        ...pos,
      },
      children: children,
    },
  };
}

// Pita CTA di bagian bawah
export function ctaBar(opts) {
  const text = (opts && opts.text) || 'alfeto.vercel.app';
  const bgColor = (opts && opts.bgColor) || '#7a5a3e';
  const textColor = (opts && opts.textColor) || '#f3ece2';

  return {
    type: 'div',
    props: {
      style: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: '1000px',
        height: '130px',
        backgroundColor: bgColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        paddingLeft: '80px',
        paddingRight: '80px',
        boxSizing: 'border-box',
      },
      children: [
        {
          type: 'div',
          props: {
            style: {
              fontSize: '30px',
              color: textColor,
              marginRight: '20px',
            },
            children: '✦',
          },
        },
        {
          type: 'div',
          props: {
            style: {
              fontSize: '32px',
              fontWeight: 700,
              color: textColor,
              letterSpacing: '1px',
            },
            children: text,
          },
        },
      ],
    },
  };
}

// Kartu CTA naratif — pakai Plus Jakarta Sans + sapaan Fraunces Italic
export function ctaCard(opts) {
  const narasi = (opts && opts.narasi) || 'Baca artikelnya, selengkapnya yuk';
  const sapaan = (opts && opts.sapaan) || '';
  const position = (opts && opts.position) || 'bottom';
  const theme = (opts && opts.theme) || 'warm';
  const fontSize = (opts && opts.fontSize) || 56;

  const themes = {
    minimalis: { bg: '#ffffff', text: '#111111', accent: '#666666' },
    bold: { bg: 'rgba(28,25,23,0.95)', text: '#ffffff', accent: '#c2410c' },
    editorial: { bg: 'rgba(243,236,226,0.95)', text: '#5a4030', accent: '#8a7660' },
    warm: { bg: 'rgba(122,90,62,0.92)', text: '#f3ece2', accent: '#e8dccb' },
    pastel: { bg: 'rgba(255,255,255,0.9)', text: '#7a5b7a', accent: '#c77db8' },
    boho: { bg: 'rgba(214,190,158,0.92)', text: '#3d2a1a', accent: '#8a5a3a' },
    light: { bg: 'rgba(255,255,255,0.92)', text: '#292524', accent: '#c2410c' },
  };
  const t = themes[theme] || themes.warm;

  const positions = {
    top: { top: '100px' },
    bottom: { bottom: '200px' },
    center: { top: '450px' },
  };
  const pos = positions[position] || positions.bottom;

  // Children: narasi + sapaan di-wrap jadi satu kalimat natural
  // Pecah narasi jadi kata individual (biar flexWrap bisa wrap per kata)
  const narasiWords = narasi.split(' ').filter(Boolean);

  const wordNodes = narasiWords.map((word, i) => ({
    type: 'div',
    props: {
      style: {
        display: 'flex',
        fontFamily: 'Plus Jakarta Sans',
        fontWeight: 600,
        color: t.text,
        marginRight: '6px',   // jarak antar kata
      },
      children: word,
    },
  }));

  // Sapaan (Fraunces Italic) — nempel di akhir, lebih gede
  if (sapaan) {
    wordNodes.push({
      type: 'div',
      props: {
        style: {
          display: 'flex',
          fontFamily: 'Fraunces',
          fontWeight: 700,
          fontStyle: 'italic',
          color: t.accent,
          fontSize: (fontSize + 10) + 'px',
          marginRight: '6px',
        },
        children: sapaan,
      },
    });
  }

  const children = [
    {
      type: 'div',
      props: {
        style: {
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'baseline',
          justifyContent: 'center',
          fontSize: fontSize + 'px',
          lineHeight: 1.4,
          color: t.text,
        },
        children: wordNodes,
      },
    },
  ];

  return {
    type: 'div',
    props: {
      style: {
        position: 'absolute',
        left: '90px',
        width: '820px',
        padding: '50px',
        backgroundColor: t.bg,
        borderRadius: '20px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        ...pos,
      },
      children: children,
    },
  };
}
