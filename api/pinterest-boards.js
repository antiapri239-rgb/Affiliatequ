// api/pinterest-boards.js
// GET/PUT/DELETE board mapping.

import {
  readPinterestData,
  getBoardsData,
  updateBoards,
  resetBoards,
  getDefaultBoards,
} from '../lib/pinterest-store.js';

export const maxDuration = 15;

function checkAuth(request) {
  const expectedToken = process.env.PINTEREST_ADMIN_TOKEN;
  if (!expectedToken) return true;
  const provided = request.query?.token || request.headers['x-admin-token'];
  return provided === expectedToken;
}

export default async function handler(request, response) {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Token');

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  if (!checkAuth(request)) {
    return response.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // ============ GET — list boards ============
    if (request.method === 'GET') {
      const data = await readPinterestData();
      const boards = getBoardsData(data);
      return response.status(200).json({
        boards,
        isCustom: data.boards !== null,
        defaultBoards: getDefaultBoards(),
      });
    }

    // ============ PUT — update 1 board ============
    if (request.method === 'PUT') {
      const body = request.body;
      if (!body || !body.name || typeof body.name !== 'string') {
        return response.status(400).json({ error: 'Nama board wajib' });
      }

      const data = await readPinterestData();
      const boards = { ...getBoardsData(data) };

      const name = body.name.trim();
      const keywords = Array.isArray(body.keywords)
        ? body.keywords.filter(k => typeof k === 'string' && k.trim()).map(k => k.trim().toLowerCase())
        : [];

      if (keywords.length === 0) {
        return response.status(400).json({ error: 'Minimal 1 keyword' });
      }

      boards[name] = {
        weight: typeof body.weight === 'number' ? body.weight : 2,
        keywords,
      };

      await updateBoards(boards);
      return response.status(200).json({ success: true, boards });
    }

    // ============ POST — reset ke default ============
    if (request.method === 'POST' && request.body?.action === 'reset') {
      const defaultBoards = await resetBoards();
      return response.status(200).json({ success: true, boards: defaultBoards });
    }

    response.setHeader('Allow', 'GET, PUT, POST, DELETE');
    return response.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error('[pinterest-boards] Error:', e);
    return response.status(500).json({ error: e.message || 'Gagal akses board' });
  }
}
