// lib/image-helpers.js
// Helper buat konversi gambar ke format yang bisa di-render resvg-js.
// resvg-js cuma bisa decode PNG & JPEG, WebP bakal di-skip silent → blank.
// Jadi semua gambar dari luar (WebP, AVIF, dll) harus dikonversi dulu.

import sharp from 'sharp';

/**
 * Konversi buffer gambar apapun ke JPEG/PNG yang bisa dibaca resvg-js.
 * Return: { buffer, mime }
 */
export async function toRenderableBuffer(buffer) {
  if (!buffer || buffer.length === 0) {
    throw new Error('Empty buffer');
  }

  // Deteksi magic bytes
  const isJPEG = buffer[0] === 0xff && buffer[1] === 0xd8;
  const isPNG = buffer[0] === 0x89 && buffer[1] === 0x50;

  // Kalau udah JPEG/PNG, langsung pakai
  if (isJPEG) return { buffer, mime: 'image/jpeg' };
  if (isPNG) return { buffer, mime: 'image/png' };

  // Selain itu (WebP, AVIF, dll) → konversi ke JPEG
  const converted = await sharp(buffer)
    .jpeg({ quality: 90, mozjpeg: true })
    .toBuffer();

  return { buffer: converted, mime: 'image/jpeg' };
}

/**
 * Bikin data URL dari buffer + mime.
 */
export function toDataUrl(buffer, mime) {
  return `data:${mime};base64,` + buffer.toString('base64');
}

/**
 * Fetch gambar dari URL → data URL siap render.
 * Auto-handle konversi WebP → JPEG.
 */
export async function fetchImageAsDataUrl(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch image: ${res.status} ${url}`);
  }

  const buf = Buffer.from(await res.arrayBuffer());
  const { buffer, mime } = await toRenderableBuffer(buf);
  return toDataUrl(buffer, mime);
}
