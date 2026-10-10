// api/pinterest-stats.js
// GET stats Pinterest: total pin, artikel, jadwal, config.
// Query: ?token=xxx (auth simple)

import { readPinterestData } from '../lib/pinterest-store.js';
import { listArticles } from '../lib/article-parser.js';

export const maxDuration = 15;

function checkAuth(request) {
  const expectedToken = process.env.PINTEREST_ADMIN_TOKEN;
  if (!expectedToken) {
    // Kalau token nggak di-set, allow (dev mode)
    return true;
  }
  const providedToken = request.query?.token || request.headers['x-admin-token'];
  return providedToken === expectedToken;
}

export default async function handler(request, response) {
  // CORS
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Token');

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).json({ error: 'Method not allowed' });
  }

  if (!checkAuth(request)) {
    return response.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Baca data dari Blob & artikel dari file
    const [data, articles] = await Promise.all([
      readPinterestData(),
      listArticles({ skipDrafts: true }),
    ]);

    // Hitung stats
    const trackedArticles = data.articles || {};
    const trackedSlugs = Object.keys(trackedArticles);

    let totalPins = 0;
    let scheduledPins = 0;
    let todayPins = 0;
    let publishedPins = 0;

    const today = new Date().toISOString().split('T')[0];

    for (const slug of trackedSlugs) {
      const art = trackedArticles[slug];
      const pins = art.pins || [];
      totalPins += pins.length;

      for (const pin of pins) {
        if (pin.status === 'scheduled') scheduledPins++;
        if (pin.status === 'published') publishedPins++;
        if (pin.scheduledFor && pin.scheduledFor.startsWith(today)) todayPins++;
      }
    }

    // Stats artikel
    const totalArticles = articles.length;
    const untrackedArticles = articles.filter(a => !trackedSlugs.includes(a.slug)).length;

    // Config
    const config = data.config;

    // Kumpulkan semua pin scheduled (untuk kalender)
    const allPins = [];
    for (const slug of trackedSlugs) {
      const art = trackedArticles[slug];
      const pins = art.pins || [];
      for (const pin of pins) {
        if (pin.scheduledFor) {
          allPins.push({
            ...pin,
            slug,
            articleTitle: art.title,
          });
        }
      }
    }
    allPins.sort((a, b) => (a.scheduledFor || '').localeCompare(b.scheduledFor || ''));

    return response.status(200).json({
      stats: {
        totalPins,
        scheduledPins,
        publishedPins,
        todayPins,
        totalArticles,
        trackedArticles: trackedSlugs.length,
        untrackedArticles,
      },
      config,
      lastUpdated: data.updatedAt,
      articles: articles.map(a => ({
        slug: a.slug,
        title: a.title,
        category: a.category,
        pubDate: a.pubDate,
        heroImage: a.heroImage,
        articleUrl: a.articleUrl,
        tracked: trackedSlugs.includes(a.slug),
        pinCount: trackedArticles[a.slug]?.pins?.length || 0,
      })),
      pins: allPins,
    });
  } catch (error) {
    console.error('[pinterest-stats] Error:', error);
    return response.status(500).json({
      error: error instanceof Error ? error.message : 'Gagal ambil stats',
    });
  }
}
