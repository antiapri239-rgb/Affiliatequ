import { put, head } from '@vercel/blob';

const BLOB_FILENAME = 'ai-settings.json';

const DEFAULT_CONFIG = {
  version: 1,
  providerOrder: ['gemini', 'groq'],
  gemini: {
    model: 'gemini-3.8-flash',
    fallbackModel: 'gemini-3.6-flash',
    enabled: true,
  },
  groq: {
    model: 'openai/gpt-oss-120b',
    enabled: true,
  },
};

function getBlobToken() {
  return process.env.BLOB_AI_CONFIG_READ_WRITE_TOKEN;
}

export async function readConfig() {
  const token = getBlobToken();
  if (!token) {
    console.warn('[config-store] Blob token tidak ada, pakai default config.');
    return { ...DEFAULT_CONFIG };
  }

  try {
    const blobInfo = await head(BLOB_FILENAME, { token });
    const response = await fetch(blobInfo.url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      console.warn(`[config-store] Fetch config gagal: HTTP ${response.status}`);
      return { ...DEFAULT_CONFIG };
    }

    const parsed = await response.json();
    return mergeWithDefault(parsed);
  } catch (error) {
    if (error?.name === 'BlobNotFoundError' || error?.status === 404) {
      console.info('[config-store] Config belum ada di Blob, pakai default.');
      return { ...DEFAULT_CONFIG };
    }
    console.warn('[config-store] Read error:', error?.message || error);
    return { ...DEFAULT_CONFIG };
  }
}

export async function writeConfig(newConfig) {
  const token = getBlobToken();
  if (!token) {
    throw new Error('BLOB_AI_CONFIG_READ_WRITE_TOKEN tidak ada');
  }

  const merged = mergeWithDefault(newConfig);
  const content = JSON.stringify(merged, null, 2);

  const result = await put(BLOB_FILENAME, content, {
    access: 'private',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
    token,
  });

  return { url: result.url, config: merged };
}

function mergeWithDefault(config) {
  return {
    ...DEFAULT_CONFIG,
    ...config,
    gemini: { ...DEFAULT_CONFIG.gemini, ...(config?.gemini || {}) },
    groq: { ...DEFAULT_CONFIG.groq, ...(config?.groq || {}) },
  };
}

export function getDefaultConfig() {
  return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
}
