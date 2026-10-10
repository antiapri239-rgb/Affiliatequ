// api/pinterest-generate.js
// POST batch generate pin dari banyak artikel.
// Body: { slugs: [], styles: [] }

import { batchGenerate } from '../lib/batch-generator.js';
import { readPinterestData } from '../lib/pinterest-store.js';

export const maxDuration = 60;  // 60 detik max

const MAX_ARTICLES = 10;

function checkAuth(request) {
  const expectedToken = process.env.PINTEREST_ADMIN_TOKEN;
  if (!expectedToken) return true;
  const provided = request.query?.token || request.headers['x-admin-token'];
  return provided === expectedToken;
}

export default async function handler(request, response) {
  // CORS
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Token');

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Method not allowed' });
  }

  if (!checkAuth(request)) {
    return response.status(401).json({ error: 'Unauthorized' });
  }

  const body = request.body;
  if (!body || !Array.isArray(body.slugs)) {
    return response.status(400).json({ error: 'Array slugs wajib' });
  }

  if (body.slugs.length === 0) {
    return response.status(400).json({ error: 'Pilih minimal 1 artikel' });
  }

  if (body.slugs.length > MAX_ARTICLES) {
    return response.status(400).json({
      error: `Maksimal ${MAX_ARTICLES} artikel per batch`,
    });
  }

  // ============ STREAMING MODE ============
  response.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  response.setHeader('Cache-Control', 'no-cache, no-transform');
  response.setHeader('Connection', 'keep-alive');
  response.setHeader('X-Accel-Buffering', 'no');

  const send = (data) => {
    response.write('data: ' + JSON.stringify(data) + '\n\n');
  };

  try {
    const data = await readPinterestData();
    const styles = Array.isArray(body.styles) && body.styles.length > 0
      ? body.styles
      : data.config.defaultStyles;

    console.info(`[pinterest-generate] Batch: ${body.slugs.length} artikel × ${styles.length} style`);

    const baseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : 'https://alfeto.vercel.app';

    // Kirim info awal
    send({
      type: 'start',
      totalArticles: body.slugs.length,
      totalPinsExpected: body.slugs.length * styles.length,
      styles,
    });

    let articleIndex = 0;
    let totalPinsSoFar = 0;

    const result = await batchGenerate(body.slugs, styles, {
      baseUrl,
      onProgress: (progress) => {
        articleIndex++;
        totalPinsSoFar += progress.pinsGenerated;

        send({
          type: 'progress',
          articleIndex,
          totalArticles: body.slugs.length,
          articleTitle: progress.articleTitle,
          articleSlug: progress.articleSlug,
          pinsGenerated: progress.pinsGenerated,
          pinsFailed: progress.pinsFailed,
          totalPinsSoFar,
        });
      },
    });

    console.info(`[pinterest-generate] Selesai: ${result.totalPins} pin`);

    send({
      type: 'done',
      success: true,
      totalPins: result.totalPins,
      startDate: result.startDate,
      results: result.results,
      pins: result.pins,
    });

    response.end();
  } catch (error) {
    console.error('[pinterest-generate] Error:', error);
    send({
      type: 'error',
      error: error instanceof Error ? error.message : 'Gagal batch generate',
    });
    response.end();
  }
}