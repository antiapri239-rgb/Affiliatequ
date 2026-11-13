export const prerender = false;
import { generatePin, AVAILABLE_STYLES } from '../../../lib/pin-generator.js';
import { uploadPin, isBlobConfigured } from '../../../lib/blob-uploader.js';
import { planLayout } from '../../../lib/ai-planner.js';

export const maxDuration = 30;

const MAX_TITLE_LENGTH = 200;
const MAX_CATEGORY_LENGTH = 100;

function getBaseUrl(request) {
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.SITE_URL) {
    return process.env.SITE_URL;
  }
  const host = request.headers.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  return `${protocol}://${host}`;
}

export const POST = async ({ request }) => {
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: 'JSON object diperlukan' }), { status: 400 });
  }

  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const imageUrl = typeof body.imageUrl === 'string' ? body.imageUrl.trim() : '';
  const beforeImageUrl = typeof body.beforeImageUrl === 'string' ? body.beforeImageUrl.trim() : '';
  const afterImageUrl = typeof body.afterImageUrl === 'string' ? body.afterImageUrl.trim() : '';
  const category = typeof body.category === 'string' ? body.category.trim() : 'Artikel';
  const style = typeof body.style === 'string' ? body.style.trim().toLowerCase() : 'warm';
  const shouldUpload = body.upload === true;
  const pngBase64 = typeof body.pngBase64 === 'string' ? body.pngBase64 : null;

  const isBeforeAfter = style === 'before-after';
  if (!title) {
    return new Response(JSON.stringify({ error: 'Title wajib diisi' }), { status: 400 });
  }
  if (isBeforeAfter) {
    if (!beforeImageUrl || !afterImageUrl) {
      return new Response(JSON.stringify({ error: 'Style "before-after" butuh beforeImageUrl + afterImageUrl' }), { status: 400 });
    }
  } else if (!imageUrl) {
    return new Response(JSON.stringify({ error: 'imageUrl wajib diisi' }), { status: 400 });
  }
  if (title.length > MAX_TITLE_LENGTH || category.length > MAX_CATEGORY_LENGTH) {
    return new Response(JSON.stringify({ error: 'Title atau category terlalu panjang' }), { status: 400 });
  }
  if (!AVAILABLE_STYLES.includes(style)) {
    return new Response(JSON.stringify({
      error: `Style "${style}" tidak dikenal`,
      availableStyles: AVAILABLE_STYLES,
    }), { status: 400 });
  }

  try {
    const baseUrl = getBaseUrl(request);
    console.info(`[generate-pin] Render style="${style}" title="${title.slice(0, 40)}..."`);
    
    let pngBuffer;

    if (pngBase64 && shouldUpload) {
      pngBuffer = Buffer.from(pngBase64, 'base64');
    } else {
      pngBuffer = await generatePin({
        title, imageUrl, beforeImageUrl, afterImageUrl, category, style, baseUrl,
      });
    }

    if (shouldUpload) {
      if (!isBlobConfigured()) {
        return new Response(JSON.stringify({ error: 'Blob belum dikonfigurasi' }), { status: 500 });
      }

      const filename = title.slice(0, 50) + '-' + style;
      const { url, pathname } = await uploadPin(pngBuffer, filename);

      let keywords = [];
      try {
        const plan = await planLayout({ title, category, style });
        keywords = (plan && plan.keywords) || [];
      } catch (e) {
        console.warn('[generate-pin] Keywords gagal:', e.message);
      }

      return new Response(JSON.stringify({
        url, pathname, style, title, category, keywords, uploadedAt: new Date().toISOString(),
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(pngBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600',
        'X-Pin-Style': style,
      },
    });

  } catch (error) {
    console.error('[generate-pin] Error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Gagal generate pin',
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
