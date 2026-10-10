// api/lib/pin-templates/_shared/compose.js
// Compose JSX Satori dari plan JSON (hasil AI atau preset fallback).

import { fullscreenImage, gradientOverlay, ctaCard, ctaBar } from './layers.js';
import { resolvePalette } from './palettes.js';
import { posterLayout } from './poster.js';
import { renderTypography } from '../typography.js';
import { renderWarm } from '../warm.js';
import { renderListicle } from '../listicle.js';
import { renderBeforeAfter } from '../before-after.js';
import { renderBoldType } from '../bold-type.js';

// Plan default kalau AI gagal total
export const DEFAULT_PLAN = {
  layout: 'photo-bottom',
  ctaCard: {
    position: 'bottom',
    narasi: 'Baca artikelnya, selengkapnya yuk',
    sapaan: 'kamu',
    fontSize: 56,
  },
  image: {
    maskFrom: 45,
    maskTo: 80,
  },
  palette: 'warm',
  gradient: {
    startAt: '55%',
  },
  cta: {
    text: 'alfeto.vercel.app',
    bgColor: '#7a5a3e',
    textColor: '#f3ece2',
  },
};

// Ambil plan, kalau null/invalid pakai default
export function normalizePlan(plan, style) {
  if (!plan || typeof plan !== 'object') {
    return { ...DEFAULT_PLAN };
  }

  return {
    layout: plan.layout || DEFAULT_PLAN.layout,
    ctaCard: {
      ...DEFAULT_PLAN.ctaCard,
      ...(plan.ctaCard || {}),
    },
    image: {
      ...DEFAULT_PLAN.image,
      ...(plan.image || {}),
    },
    palette: plan.palette || DEFAULT_PLAN.palette,
    gradient: {
      ...DEFAULT_PLAN.gradient,
      ...(plan.gradient || {}),
    },
    cta: {
      ...DEFAULT_PLAN.cta,
      ...(plan.cta || {}),
    },
    typography: plan.typography || {},
    boldHook: plan.boldHook || {},
  };
}

// Compose JSX utama
export function composeFromPlan(plan, ctx) {
  const title = ctx.title || '';
  const category = ctx.category || '';
  const imageDataUrl = ctx.imageDataUrl || null;
  const style = ctx.style || 'warm';

  const p = normalizePlan(plan, style);
  const palette = resolvePalette(p.palette);

  // Style 'before-after' pakai layout khusus
  if (style === 'before-after') {
    return renderBeforeAfter({ title, beforeImageUrl: ctx.beforeImageUrl, afterImageUrl: ctx.afterImageUrl, category, plan: p });
  }

  // Style 'listicle' pakai layout khusus
  if (style === 'listicle') {
    return renderListicle({ title, imageDataUrl, category, plan: p });
  }

  // Style 'warm' pakai layout khusus
  if (style === 'warm') {
    return renderWarm({ title, imageDataUrl, category, plan: p });
  }

  // Style 'bold-type' pakai layout khusus
  if (style === 'bold-type') {
    return renderBoldType({ title, imageDataUrl, category, plan: p });
  }

  // Style 'typography' pakai layout khusus
  if (style === 'typography') {
    return renderTypography({ title, imageDataUrl, category, plan: p });
  }

  // Style 'poster' pakai layout khusus
  if (style === 'poster') {
    return posterLayout({ title, imageDataUrl, category, plan: p });
  }

  const layers = [];

  // Layer 1: foto full-screen dengan mask gradient
  layers.push(
    fullscreenImage(imageDataUrl, {
      maskFrom: p.image.maskFrom,
      maskTo: p.image.maskTo,
    })
  );

  // Layer 2: gradient overlay bawah
  layers.push(
    gradientOverlay({
      from: 'transparent',
      to: palette.to,
      startAt: p.gradient.startAt,
    })
  );

  // Layer 3: CTA card (narasi + sapaan)
  layers.push(
    ctaCard({
      narasi: p.ctaCard.fullText || p.ctaCard.narasi,
      sapaan: '',
      position: p.ctaCard.position,
      theme: style,
      fontSize: p.ctaCard.fontSize,
    })
  );

  // Layer 4: pita CTA bawah — text SELALU dari preset, jangan biarin AI override
  layers.push(
    ctaBar({
      text: 'alfeto.vercel.app',
      bgColor: palette.to,
      textColor: palette.accent,
    })
  );

  // Root container
  return {
    type: 'div',
    props: {
      style: {
        position: 'relative',
        display: 'flex',
        width: '1000px',
        height: '1500px',
        backgroundColor: '#f3ece2',
        fontFamily: 'Plus Jakarta Sans',
        overflow: 'hidden',
      },
      children: layers,
    },
  };
}
