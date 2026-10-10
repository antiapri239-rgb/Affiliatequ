import { generateWithGemini } from './providers/gemini.js';
import { generateWithGroq } from './providers/groq.js';
import { readConfig } from './config-store.js';

const providers = {
  gemini: generateWithGemini,
  groq: generateWithGroq,
};

const DEFAULT_PROVIDER_ORDER = 'gemini,groq';

function getEnvProviderOrder() {
  const raw = process.env.AI_PROVIDER_ORDER || process.env.AI_PROVIDER || DEFAULT_PROVIDER_ORDER;
  return raw.split(',').map(name => name.trim()).filter(Boolean);
}

function pickEnabledProviders(config) {
  const order = Array.isArray(config?.providerOrder) && config.providerOrder.length > 0
    ? config.providerOrder
    : getEnvProviderOrder();

  return order.filter(name => {
    if (name === 'gemini') return config?.gemini?.enabled !== false;
    if (name === 'groq') return config?.groq?.enabled !== false;
    return false;
  });
}

export async function generateArticle({ title, category, onArticleChunk }) {
  let config;
  try {
    config = await readConfig();
  } catch (error) {
    console.warn('[ai-provider] Gagal baca config dari Blob, pakai default:', error?.message);
    config = null;
  }

  const order = pickEnabledProviders(config);
  const errors = [];

  if (order.length === 0) {
    throw new Error('Tidak ada provider AI yang aktif di konfigurasi.');
  }

  const runtimeOptions = {
    gemini: {
      model: config?.gemini?.model,
      fallbackModel: config?.gemini?.fallbackModel,
    },
    groq: {
      model: config?.groq?.model,
    },
  };

  for (let i = 0; i < order.length; i += 1) {
    const providerName = order[i];
    const provider = providers[providerName];

    if (!provider) {
      const msg = `Unknown provider "${providerName}", skipping.`;
      console.warn(msg);
      errors.push(`${providerName}: ${msg}`);
      continue;
    }

    try {
      console.info(`[ai-provider] Trying provider "${providerName}" (${i + 1}/${order.length}).`);
      return await provider({
        title,
        category,
        onArticleChunk,
        options: runtimeOptions[providerName] || {},
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`[ai-provider] Provider "${providerName}" failed: ${message}`);
      errors.push(`${providerName}: ${message}`);
    }
  }

  const summary = errors.length
    ? `Semua provider AI gagal. ${errors.join(' | ')}`
    : 'Tidak ada provider AI yang tersedia.';
  throw new Error(summary);
}
