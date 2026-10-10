import { readConfig, writeConfig, getDefaultConfig } from '../lib/config-store.js';

function checkAuth(request) {
  const token = process.env.AI_SETTINGS_ADMIN_TOKEN;
  if (!token) {
    return { ok: false, reason: 'Admin token belum di-set di server' };
  }

  const header = request.headers.authorization || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return { ok: false, reason: 'Authorization header tidak ada' };
  }

  if (match[1].trim() !== token.trim()) {
    return { ok: false, reason: 'Token tidak valid' };
  }

  return { ok: true };
}

function sanitizeConfig(input) {
  const allowedProviders = ['gemini', 'groq'];
  const clean = {};

  if (Array.isArray(input?.providerOrder)) {
    const order = input.providerOrder
      .filter(name => typeof name === 'string')
      .map(name => name.trim().toLowerCase())
      .filter(name => allowedProviders.includes(name));
    if (order.length > 0) clean.providerOrder = order;
  }

  if (input?.gemini && typeof input.gemini === 'object') {
    clean.gemini = {};
    if (typeof input.gemini.model === 'string' && input.gemini.model.trim()) {
      clean.gemini.model = input.gemini.model.trim();
    }
    if (typeof input.gemini.fallbackModel === 'string' && input.gemini.fallbackModel.trim()) {
      clean.gemini.fallbackModel = input.gemini.fallbackModel.trim();
    }
    if (typeof input.gemini.enabled === 'boolean') {
      clean.gemini.enabled = input.gemini.enabled;
    }
  }

  if (input?.groq && typeof input.groq === 'object') {
    clean.groq = {};
    if (typeof input.groq.model === 'string' && input.groq.model.trim()) {
      clean.groq.model = input.groq.model.trim();
    }
    if (typeof input.groq.enabled === 'boolean') {
      clean.groq.enabled = input.groq.enabled;
    }
  }

  return clean;
}

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');

  if (request.method === 'GET') {
    const config = await readConfig();
    const hasGeminiKey = !!process.env.GEMINI_API_KEY;
    const hasGroqKey = !!process.env.GROQ_API_KEY;
    return response.status(200).json({
      config,
      defaults: getDefaultConfig(),
      keys: { gemini: hasGeminiKey, groq: hasGroqKey },
    });
  }

  if (request.method === 'POST') {
    const auth = checkAuth(request);
    if (!auth.ok) {
      return response.status(401).json({ error: auth.reason });
    }

    const body = request.body;
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return response.status(400).json({ error: 'JSON object diperlukan' });
    }

    try {
      const sanitized = sanitizeConfig(body);
      if (Object.keys(sanitized).length === 0) {
        return response.status(400).json({ error: 'Tidak ada field valid untuk disimpan' });
      }

      const result = await writeConfig(sanitized);
      return response.status(200).json({ ok: true, config: result.config, url: result.url });
    } catch (error) {
      console.error('[settings] Write error:', error);
      return response.status(500).json({
        error: error instanceof Error ? error.message : 'Gagal simpan config',
      });
    }
  }

  response.setHeader('Allow', 'GET, POST');
  return response.status(405).json({ error: 'Method not allowed' });
}
