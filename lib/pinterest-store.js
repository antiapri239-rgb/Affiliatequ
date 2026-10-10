// lib/pinterest-store.js
// Database tracking Pinterest (artikel + pin + jadwal) di Vercel Blob.
// Struktur: JSON tunggal, semua metadata.

import { put, head } from '@vercel/blob';

const BLOB_FILENAME = 'pinterest-data.json';

const DEFAULT_DATA = {
  version: 1,
  config: {
    pinsPerArticle: 3,
    defaultStyles: ['warm', 'poster', 'typography'],
    postTimes: ['06:00', '12:00', '17:00'],
    timezone: 'WIB',
    autoOffset: true,
    lastScheduled: null,
  },
  boards: null,  // null = pakai default dari board-mapper.js
  articles: {},
  updatedAt: null,
};

// Board default (dari board-mapper.js, jadi fallback)
const DEFAULT_BOARDS = {
  "Rak & Ambalan": { weight: 3, keywords: ["rak", "ambalan", "dinding", "gantung", "shelf", "floating"] },
  "Lampu & Pencahayaan": { weight: 3, keywords: ["lampu", "meja", "tidur", "cahaya", "lighting", "lamp", "led"] },
  "Dekorasi Kamar": { weight: 2, keywords: ["dekorasi", "kamar", "aesthetic", "cozy", "bedroom", "ruang tidur"] },
  "Tanaman & Hijau": { weight: 2, keywords: ["tanaman", "hias", "bunga", "hijau", "plant", "monstera", "kaktus"] },
  "Wall Panel & Dinding": { weight: 2, keywords: ["wall", "panel", "pvc", "wallpaper", "wpc", "wallboard"] },
  "Meja & Kursi": { weight: 2, keywords: ["meja", "kursi", "table", "chair", "desk", "ergonomis"] },
  "Karpet & Alas": { weight: 2, keywords: ["karpet", "alas", "rug", "mat", "permadani"] },
  "Storage & Organizer": { weight: 2, keywords: ["storage", "organizer", "kotak", "box", "penyimpanan", "lemari"] },
  "Dapur & Dinning": { weight: 2, keywords: ["dapur", "kitchen", "dining", "piring", "gelas", "mug"] },
  "Kamar Mandi": { weight: 2, keywords: ["kamar mandi", "bathroom", "shower", "toilet", "wastafel"] },
};

function getBlobToken() {
  return process.env.BLOB_AI_CONFIG_READ_WRITE_TOKEN;
}

/**
 * Baca data Pinterest dari Blob.
 * @returns {Promise<Object>}
 */
export async function readPinterestData() {
  const token = getBlobToken();
  if (!token) {
    console.warn('[pinterest-store] Blob token nggak ada, pakai default');
    return { ...DEFAULT_DATA };
  }

  try {
    const blobInfo = await head(BLOB_FILENAME, { token });
    const response = await fetch(blobInfo.url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      console.warn('[pinterest-store] Fetch gagal:', response.status);
      return { ...DEFAULT_DATA };
    }

    const parsed = await response.json();
    return mergeWithDefault(parsed);
  } catch (error) {
    const msg = error?.message || '';
    const isNotFound =
      error?.name === 'BlobNotFoundError' ||
      error?.status === 404 ||
      msg.includes('does not exist') ||
      msg.includes('not found');

    if (isNotFound) {
      // Normal: data belum ada di Blob, pakai default
      return { ...DEFAULT_DATA };
    }
    console.warn('[pinterest-store] Read error:', msg);
    return { ...DEFAULT_DATA };
  }
}

/**
 * Tulis data Pinterest ke Blob.
 */
export async function writePinterestData(data) {
  const token = getBlobToken();
  if (!token) {
    throw new Error('BLOB_AI_CONFIG_READ_WRITE_TOKEN nggak ada');
  }

  const merged = mergeWithDefault(data);
  merged.updatedAt = new Date().toISOString();

  const content = JSON.stringify(merged, null, 2);

  const result = await put(BLOB_FILENAME, content, {
    access: 'private',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
    token,
  });

  return { url: result.url, data: merged };
}

/**
 * Update 1 artikel di data.
 */
export async function updateArticle(slug, articleData) {
  const data = await readPinterestData();
  data.articles[slug] = {
    ...(data.articles[slug] || {}),
    ...articleData,
    updatedAt: new Date().toISOString(),
  };
  await writePinterestData(data);
  return data.articles[slug];
}

/**
 * Hapus 1 artikel dari tracking.
 */
export async function deleteArticle(slug) {
  const data = await readPinterestData();
  delete data.articles[slug];
  await writePinterestData(data);
  return true;
}

/**
 * Update config.
 */
export async function updateConfig(configUpdates) {
  const data = await readPinterestData();
  data.config = { ...data.config, ...configUpdates };
  await writePinterestData(data);
  return data.config;
}

/**
 * Merge dengan default (kalau ada field baru).
 */
function mergeWithDefault(loaded) {
  return {
    version: DEFAULT_DATA.version,
    config: {
      ...DEFAULT_DATA.config,
      ...(loaded?.config || {}),
    },
    boards: loaded?.boards || null,  // null = pakai default
    articles: loaded?.articles || {},
    updatedAt: loaded?.updatedAt || null,
  };
}

/**
 * Ambil board mapping (dari store atau default).
 */
export function getBoardsData(data) {
  return data?.boards || DEFAULT_BOARDS;
}

/**
 * Update board mapping.
 */
export async function updateBoards(boards) {
  const data = await readPinterestData();
  data.boards = boards;
  await writePinterestData(data);
  return data.boards;
}

/**
 * Reset board ke default.
 */
export async function resetBoards() {
  const data = await readPinterestData();
  data.boards = null;
  await writePinterestData(data);
  return DEFAULT_BOARDS;
}

export function getDefaultBoards() {
  return JSON.parse(JSON.stringify(DEFAULT_BOARDS));
}

export function getDefaultData() {
  return JSON.parse(JSON.stringify(DEFAULT_DATA));
}
