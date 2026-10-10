// lib/batch-generator.js
// Batch generate pin dari banyak artikel: generate + upload Blob + tracking.

import { listArticles } from './article-parser.js';
import { generatePin } from './pin-generator.js';
import { uploadPin } from './blob-uploader.js';
import { planLayout } from './ai-planner.js';
import { assignBoard } from './board-mapper.js';
import { updateArticle, readPinterestData, writePinterestData } from './pinterest-store.js';

/**
 * Generate pin untuk 1 artikel (multi-style).
 * @param {Object} article - dari listArticles()
 * @param {Array<string>} styles - ['minimalis', 'editorial', 'warm']
 * @param {Object} opts - { baseUrl }
 * @returns {Promise<Array>} - list pins
 */
export async function generatePinsForArticle(article, styles, opts) {
  const baseUrl = (opts && opts.baseUrl) || 'https://alfeto.vercel.app';
  const pins = [];

  for (const style of styles) {
    try {
      console.log(`[batch] ${article.slug} → ${style}`);

      // 1. Generate pin (PNG)
      const pngBuffer = await generatePin({
        title: article.title,
        imageUrl: article.heroImage,
        category: article.category,
        style,
        baseUrl,
      });

      // 2. Upload ke Blob
      const filename = article.slug + '-' + style;
      const { url, pathname } = await uploadPin(pngBuffer, filename);

      // 3. Generate keywords (via AI Planner)
      let keywords = [];
      try {
        const plan = await planLayout({
          title: article.title,
          category: article.category,
          style,
        });
        keywords = (plan && plan.keywords) || [];
      } catch (e) {
        console.warn(`[batch] Keywords gagal (${style}):`, e.message);
      }

      // 4. Auto-assign board
      const board = await assignBoard(article.title, article.category);

      pins.push({
        style,
        url,
        pathname,
        board,
        keywords,
        title: article.title,
        category: article.category,
        articleUrl: article.articleUrl,
        generatedAt: new Date().toISOString(),
        status: 'pending',
      });

      console.log(`[batch] ✅ ${article.slug} → ${style}: ${url}`);
    } catch (e) {
      console.error(`[batch] ❌ ${article.slug} → ${style}:`, e.message);
      pins.push({
        style,
        title: article.title,
        category: article.category,
        error: e.message,
        status: 'failed',
      });
    }
  }

  return pins;
}

/**
 * Batch generate untuk banyak artikel.
 * @param {Array<string>} slugs - list slug artikel
 * @param {Array<string>} styles - list style
 * @param {Object} opts - { baseUrl, onProgress }
 * @returns {Promise<Object>} - { results, totalPins }
 */
export async function batchGenerate(slugs, styles, opts) {
  const allArticles = await listArticles({ skipDrafts: true });
  const articles = allArticles.filter(a => slugs.includes(a.slug));

  if (articles.length === 0) {
    throw new Error('Nggak ada artikel yang valid');
  }

  // Baca data AWAL (untuk config + tracking)
  const initialData = await readPinterestData();
  const config = initialData.config;
  const postTimes = config.postTimes || ['06:00', '12:00', '17:00'];

  // Hitung start date (auto-offset)
  let startDate = new Date();
  if (config.autoOffset && config.lastScheduled) {
    const last = new Date(config.lastScheduled);
    startDate = new Date(last.getTime() + 24 * 60 * 60 * 1000);
  }

  const results = [];
  const allPins = [];
  const articlesToUpdate = {};  // ⭐ Kumpulkan dulu
  let pinIndex = 0;

  const onProgress = (opts && opts.onProgress) || (() => {});

  for (const article of articles) {
    console.log(`[batch] Processing: ${article.title}`);

    const pins = await generatePinsForArticle(article, styles, opts);
    const successPins = pins.filter(p => p.status !== 'failed');

    // Callback progress per artikel
    onProgress({
      articleSlug: article.slug,
      articleTitle: article.title,
      pinsGenerated: successPins.length,
      pinsFailed: pins.filter(p => p.status === 'failed').length,
    });

    // Assign jadwal
    const now = new Date();

    for (const pin of successPins) {
      let scheduled = null;
      let attempts = 0;

      while (!scheduled && attempts < postTimes.length * 365) {
        const dayOffset = Math.floor(pinIndex / postTimes.length);
        const timeIndex = pinIndex % postTimes.length;
        const [hour, min] = postTimes[timeIndex].split(':').map(Number);

        const candidate = new Date(startDate);
        candidate.setDate(candidate.getDate() + dayOffset);
        candidate.setHours(hour, min, 0, 0);

        if (candidate > now) {
          scheduled = candidate;
        } else {
          pinIndex++;
        }
        attempts++;
      }

      if (scheduled) {
        pin.scheduledFor = scheduled.toISOString();
        pin.status = 'scheduled';
        pinIndex++;
      } else {
        pin.status = 'pending';
        pin.scheduledFor = null;
      }

      allPins.push(pin);
    }

    // ⭐ Kumpulkan data artikel (JANGAN tulis ke store di sini)
    articlesToUpdate[article.slug] = {
      title: article.title,
      category: article.category,
      heroImage: article.heroImage,
      articleUrl: article.articleUrl,
      pins: successPins,
      generatedAt: new Date().toISOString(),
      scheduledStart: successPins[0]?.scheduledFor || null,
    };

    results.push({
      slug: article.slug,
      title: article.title,
      pinsGenerated: successPins.length,
      pinsFailed: pins.filter(p => p.status === 'failed').length,
    });
  }

  // ⭐ Tulis ke store SEKALI di akhir (setelah semua selesai)
  const freshData = await readPinterestData();
  freshData.articles = { ...freshData.articles, ...articlesToUpdate };

  if (allPins.length > 0) {
    const lastPin = allPins[allPins.length - 1];
    freshData.config.lastScheduled = lastPin.scheduledFor;
  }

  await writePinterestData(freshData);

  console.log('[batch] Total articles in store:', Object.keys(freshData.articles).length);
  console.log('[batch] Total pins scheduled:', allPins.length);

  return {
    results,
    pins: allPins,
    totalPins: allPins.length,
    startDate: startDate.toISOString(),
  };
}
