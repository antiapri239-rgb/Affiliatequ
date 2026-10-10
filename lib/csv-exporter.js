// lib/csv-exporter.js
// Export data pin ke format CSV Pinterest/Canva-ready.

import { assignBoard } from './board-mapper.js';

/**
 * Escape CSV cell (handle koma, quote, newline).
 */
function escapeCell(value) {
  if (value == null) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

/**
 * Generate CSV dari array pin.
 * @param {Array} pins - Array { title, imageUrl, category, style, link, description, publishDate }
 * @returns {string} - CSV content
 */
export function generateCsv(pins) {
  const headers = ['Title', 'Media URL', 'Board', 'Description', 'Link', 'Publish date', 'Keywords'];
  const rows = [headers.join(',')];

  for (const pin of pins) {
    const board = pin.board || assignBoard(pin.title, pin.category);
    const description = pin.description || (pin.title + ' - ' + (pin.category || 'Inspirasi ruang aesthetic'));

    // Keywords: dari pin.keywords (AI/manual) atau fallback dari kategori + judul
    const keywords = pin.keywords
      || [
          pin.category || 'Inspirasi Ruang',
          pin.title.split(' ').slice(0, 4).join(' '),
        ].filter(Boolean).join(', ');

    const row = [
      escapeCell(pin.title),
      escapeCell(pin.imageUrl),
      escapeCell(board),
      escapeCell(description),
      escapeCell(pin.link || ''),
      escapeCell(pin.publishDate || ''),
      escapeCell(keywords),
    ];
    rows.push(row.join(','));
  }

  return rows.join('\n');
}

/**
 * Generate CSV dengan auto-schedule (spread N pin per hari).
 * @param {Array} pins - Array pin data
 * @param {Object} opts - { pinsPerDay, startDate }
 * @returns {string} - CSV content dengan Publish date terisi
 */
export function generateScheduledCsv(pins, opts) {
  const pinsPerDay = (opts && opts.pinsPerDay) || 3;
  const startDate = (opts && opts.startDate) || new Date();

  const startMs = new Date(startDate).getTime();
  const pinsWithDates = pins.map((pin, i) => {
    const dayOffset = Math.floor(i / pinsPerDay);
    const hourOffset = (i % pinsPerDay) * 4;  // 4 jam jeda antar pin
    const publishMs = startMs + (dayOffset * 24 * 60 * 60 * 1000) + (hourOffset * 60 * 60 * 1000);
    const publishDate = new Date(publishMs).toISOString().replace(/\.\d{3}Z$/, 'Z');
    return { ...pin, publishDate };
  });

  return generateCsv(pinsWithDates);
}
