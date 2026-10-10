// api/pinterest-schedule.js
// GET config jadwal, PUT update config jadwal.

import { readPinterestData, writePinterestData } from '../lib/pinterest-store.js';

export const maxDuration = 15;

function checkAuth(request) {
  const expectedToken = process.env.PINTEREST_ADMIN_TOKEN;
  if (!expectedToken) return true;
  const provided = request.query?.token || request.headers['x-admin-token'];
  return provided === expectedToken;
}

export default async function handler(request, response) {
  // CORS
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Token');

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  if (!checkAuth(request)) {
    return response.status(401).json({ error: 'Unauthorized' });
  }

  // ============ GET — baca config ============
  if (request.method === 'GET') {
    try {
      const data = await readPinterestData();
      return response.status(200).json({
        config: data.config,
        lastUpdated: data.updatedAt,
      });
    } catch (e) {
      console.error('[pinterest-schedule] GET error:', e);
      return response.status(500).json({ error: 'Gagal baca config' });
    }
  }

  // ============ PUT — update config ============
  if (request.method === 'PUT' || request.method === 'POST') {
    const body = request.body;
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return response.status(400).json({ error: 'JSON object wajib' });
    }

    // Validasi field
    const updates = {};

    if (Array.isArray(body.defaultStyles)) {
      updates.defaultStyles = body.defaultStyles;
    }
    if (Array.isArray(body.postTimes)) {
      // Validate format HH:MM
      const validTimes = body.postTimes.filter(t => /^\d{2}:\d{2}$/.test(t));
      if (validTimes.length === 0) {
        return response.status(400).json({ error: 'postTimes harus format HH:MM' });
      }
      updates.postTimes = validTimes;
    }
    if (typeof body.pinsPerArticle === 'number') {
      updates.pinsPerArticle = Math.max(1, Math.min(7, body.pinsPerArticle));
    }
    if (typeof body.autoOffset === 'boolean') {
      updates.autoOffset = body.autoOffset;
    }
    if (typeof body.timezone === 'string') {
      updates.timezone = body.timezone;
    }
    if (body.lastScheduled === null || typeof body.lastScheduled === 'string') {
      updates.lastScheduled = body.lastScheduled;
    }

    try {
      const data = await readPinterestData();
      data.config = { ...data.config, ...updates };
      await writePinterestData(data);
      return response.status(200).json({
        success: true,
        config: data.config,
      });
    } catch (e) {
      console.error('[pinterest-schedule] PUT error:', e);
      return response.status(500).json({ error: 'Gagal update config' });
    }
  }

  response.setHeader('Allow', 'GET, PUT');
  return response.status(405).json({ error: 'Method not allowed' });
}
