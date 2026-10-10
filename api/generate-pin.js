import { generatePin, AVAILABLE_STYLES } from '../lib/pin-generator.js';
import { uploadPin, isBlobConfigured } from '../lib/blob-uploader.js';
import { planLayout } from '../lib/ai-planner.js';

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
  const host = request.headers.host || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  return `${protocol}://${host}`;
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const body = request.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return response.status(400).json({ error: 'JSON object diperlukan' });
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
    return response.status(400).json({ error: 'Title wajib diisi' });
  }
  if (isBeforeAfter) {
    if (!beforeImageUrl || !afterImageUrl) {
      return response.status(400).json({ error: 'Style "before-after" butuh beforeImageUrl + afterImageUrl' });
    }
  } else if (!imageUrl) {
    return response.status(400).json({ error: 'imageUrl wajib diisi' });
  }
  if (title.length > MAX_TITLE_LENGTH || category.length > MAX_CATEGORY_LENGTH) {
    return response.status(400).json({ error: 'Title atau category terlalu panjang' });
  }
  if (!AVAILABLE_STYLES.includes(style)) {
    return response.status(400).json({
      error: `Style "${style}" tidak dikenal`,
      availableStyles: AVAILABLE_STYLES,
    });
  }

  try {
    const baseUrl = getBaseUrl(request);
    console.info(`[generate-pin] Render style="${style}" title="${title.slice(0, 40)}..."`);
    console.info(`[generate-pin] imageUrl="${imageUrl}" baseUrl="${baseUrl}"`);

    let pngBuffer;

    if (pngBase64 && shouldUpload) {
      // Kalau ada pngBase64 + upload, langsung pakai — skip generate
      console.info('[generate-pin] Pakai pngBase64 (skip generate)');
      pngBuffer = Buffer.from(pngBase64, 'base64');
    } else {
      // Generate normal
      pngBuffer = await generatePin({
        title,
        imageUrl,
        beforeImageUrl,
        afterImageUrl,
        category,
        style,
        baseUrl,
      });
    }

    // Kalau upload=true, upload ke Blob & return JSON
    if (shouldUpload) {
      if (!isBlobConfigured()) {
        return response.status(500).json({
          error: 'Blob belum dikonfigurasi (BLOB_PIN_READ_WRITE_TOKEN / BLOB_AI_CONFIG_READ_WRITE_TOKEN)',
        });
      }

      const filename = title.slice(0, 50) + '-' + style;
      const { url, pathname } = await uploadPin(pngBuffer, filename);

      // Generate keywords (kalau pakai pngBase64, plan belum ada)
      let keywords = [];
      try {
        const plan = await planLayout({ title, category, style });
        keywords = (plan && plan.keywords) || [];
      } catch (e) {
        console.warn('[generate-pin] Keywords gagal:', e.message);
      }

      console.info(`[generate-pin] Upload sukses: ${url} | keywords: ${keywords.length}`);

      return response.status(200).json({
        url,
        pathname,
        style,
        title,
        category,
        keywords,
        uploadedAt: new Date().toISOString(),
      });
    }

    // Default: return PNG binary
    response.setHeader('Content-Type', 'image/png');
    response.setHeader('Cache-Control', 'public, max-age=3600');
    response.setHeader('X-Pin-Style', style);

    return response.status(200).send(pngBuffer);
  } catch (error) {
    console.error('[generate-pin] Error:', error);
    return response.status(500).json({
      error: error instanceof Error ? error.message : 'Gagal generate pin',
    });
  }
}
