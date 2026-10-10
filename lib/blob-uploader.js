// lib/blob-uploader.js
// Upload gambar pin (PNG) ke Vercel Blob, return URL publik.
// Dipakai buat CSV export / share URL Pinterest.

import { put } from '@vercel/blob';

// Prefix folder di Blob
const BLOB_PREFIX = 'pins';

function getBlobToken() {
  // HANYA pakai token pin (public store) — JANGAN fallback ke AI token (private)
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    console.warn('[blob-uploader] BLOB_READ_WRITE_TOKEN tidak ada!');
    return null;
  }
  return token.trim();
}

/**
 * Upload PNG buffer ke Vercel Blob.
 * @param {Buffer} pngBuffer - Buffer PNG
 * @param {string} filename - Nama file (tanpa prefix)
 * @returns {Promise<{ url: string, pathname: string }>}
 */
export async function uploadPin(pngBuffer, filename) {
  const token = getBlobToken();
  if (!token) {
    throw new Error('Blob token tidak ada (BLOB_READ_WRITE_TOKEN / BLOB_AI_CONFIG_READ_WRITE_TOKEN)');
  }

  if (!Buffer.isBuffer(pngBuffer)) {
    throw new Error('pngBuffer harus Buffer');
  }

  // Sanitize filename
  const safeName = (filename || 'pin-' + Date.now())
    .replace(/[^a-z0-9-_.]/gi, '-')
    .toLowerCase()
    .slice(0, 100);

  const pathname = BLOB_PREFIX + '/' + safeName + '.png';

  console.info('[blob-uploader] Token prefix:', token ? token.slice(0, 30) + '...' : 'MISSING');
  console.info('[blob-uploader] Uploading:', pathname, '| size:', pngBuffer.length, 'bytes');

  const result = await put(pathname, pngBuffer, {
    access: 'public',
    contentType: 'image/png',
    addRandomSuffix: true,
    allowOverwrite: false,
    token,
  });

  return {
    url: result.url,
    pathname: result.pathname,
  };
}

/**
 * Cek apakah Blob token tersedia.
 * @returns {boolean}
 */
export function isBlobConfigured() {
  return Boolean(getBlobToken());
}
