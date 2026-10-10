// lib/board-mapper.js
// Auto-route pin ke board Pinterest berdasarkan keyword.
// Baca dari pinterest-store (custom) atau fallback ke default.

import { readPinterestData, getBoardsData } from './pinterest-store.js';

const DEFAULT_BOARD = "Inspirasi Ruang";

// Cache board data (biar nggak baca Blob tiap panggilan)
let boardsCache = null;
let boardsCacheTime = 0;
const CACHE_TTL = 60 * 1000; // 60 detik

/**
 * Ambil board data (dari cache atau store).
 */
async function getBoards() {
  const now = Date.now();
  if (boardsCache && (now - boardsCacheTime) < CACHE_TTL) {
    return boardsCache;
  }

  try {
    const data = await readPinterestData();
    boardsCache = getBoardsData(data);
    boardsCacheTime = now;
    return boardsCache;
  } catch (e) {
    console.warn('[board-mapper] Gagal baca boards:', e.message);
    return null;
  }
}

/**
 * Assign board berdasarkan judul + subtitle (async — baca dari store).
 */
export async function assignBoard(title, subtitle) {
  const BOARD_MAP = await getBoards();

  if (!BOARD_MAP) {
    return DEFAULT_BOARD;
  }

  const text = ((title || '') + ' ' + (subtitle || '')).toLowerCase();

  if (!text.trim()) {
    return DEFAULT_BOARD;
  }

  let bestBoard = DEFAULT_BOARD;
  let bestScore = 0;

  for (const [boardName, config] of Object.entries(BOARD_MAP)) {
    let score = 0;
    const keywords = config.keywords || [];
    const weight = config.weight || 2;

    for (const keyword of keywords) {
      if (text.includes(keyword.toLowerCase())) {
        score += weight;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestBoard = boardName;
    }
  }

  return bestBoard;
}

/**
 * Assign board (versi sync — pakai cache kalau ada).
 */
export function assignBoardSync(title, subtitle) {
  const BOARD_MAP = boardsCache;
  if (!BOARD_MAP) return DEFAULT_BOARD;

  const text = ((title || '') + ' ' + (subtitle || '')).toLowerCase();
  if (!text.trim()) return DEFAULT_BOARD;

  let bestBoard = DEFAULT_BOARD;
  let bestScore = 0;

  for (const [boardName, config] of Object.entries(BOARD_MAP)) {
    let score = 0;
    const keywords = config.keywords || [];
    const weight = config.weight || 2;

    for (const keyword of keywords) {
      if (text.includes(keyword.toLowerCase())) {
        score += weight;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestBoard = boardName;
    }
  }

  return bestBoard;
}

/**
 * Reset cache (dipanggil setelah update board).
 */
export function resetBoardCache() {
  boardsCache = null;
  boardsCacheTime = 0;
}

export function getDefaultBoard() {
  return DEFAULT_BOARD;
}
