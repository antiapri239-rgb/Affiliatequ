// api/export-csv.js
// Endpoint buat download CSV dari array pin.
// POST { pins: [{ title, imageUrl, category, style, link }], schedule: true, pinsPerDay: 3 }

import { generateCsv, generateScheduledCsv } from '../lib/csv-exporter.js';

export const maxDuration = 30;

const MAX_PINS = 200;  // Limit Pinterest

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const body = request.body;
  if (!body || !Array.isArray(body.pins)) {
    return response.status(400).json({ error: 'Array pins wajib' });
  }

  if (body.pins.length === 0) {
    return response.status(400).json({ error: 'Pins kosong' });
  }

  if (body.pins.length > MAX_PINS) {
    return response.status(400).json({ 
      error: 'Maksimal ' + MAX_PINS + ' pin per CSV (limit Pinterest)' 
    });
  }

  try {
    let csvContent;

    if (body.schedule === true) {
      csvContent = generateScheduledCsv(body.pins, {
        pinsPerDay: body.pinsPerDay || 3,
        startDate: body.startDate || new Date(),
      });
    } else {
      csvContent = generateCsv(body.pins);
    }

    const filename = 'alfeto-pins-' + Date.now() + '.csv';

    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader('Content-Disposition', 'attachment; filename="' + filename + '"');
    response.setHeader('Cache-Control', 'no-cache');

    return response.status(200).send(csvContent);
  } catch (error) {
    console.error('[export-csv] Error:', error);
    return response.status(500).json({
      error: error instanceof Error ? error.message : 'Gagal generate CSV',
    });
  }
}
