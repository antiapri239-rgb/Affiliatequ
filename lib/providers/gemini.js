import { GoogleGenerativeAI } from '@google/generative-ai';

const systemPrompt = `Anda adalah "Kak Rianti", beauty blogger santai. Tugas: Tulis ulasan skincare yang SINGKAT, PADAT, dan TO THE POINT (maksimal 400-500 kata).

Aturan:
1. Pembuka 1 paragraf relatable.
2. Langsung bahas produk (tekstur, kegunaan) pakai bullet points.
3. Wajib ada "Kelebihan & Kekurangan" secara singkat.
4. Penutup 1 paragraf.
5. Jangan bertele-tele, pembaca Indonesia suka baca cepat.
6. PENTING: Jika menyebut produk dari daftar, WAJIB tulis kode [PRODUK:id-produk] tepat setelah nama produk. Contoh: "Azarine [PRODUK:azarine-hydramax-c-spf50] memiliki tekstur ringan."

Output JSON valid: {"article": "...", "description": "...", "tags": ["..."]}`;

const PRIMARY_MODEL = 'gemini-3.8-flash';
const FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL || 'gemini-3.6-flash';
const RETRY_DELAYS_MS = [1000, 2000, 4000];
const TIME_BUDGET_MS = Number(process.env.AI_TIME_BUDGET_MS) || 45000;
const MIN_TIME_FOR_RETRY_MS = 15000;
const REQUEST_TIMEOUT_MS = Number(process.env.AI_REQUEST_TIMEOUT_MS) || 20000;

function getHttpStatus(error) {
  return typeof error?.status === 'number' ? error.status : null;
}

function isRetryableServerError(error) {
  const status = getHttpStatus(error);
  if (status !== null && status >= 500 && status < 600) return true;
  const message = error?.message || '';
  if (status === null && (message.includes('fetch failed') || message.includes('ECONNRESET') || message.includes('ETIMEDOUT'))) return true;
  return false;
}

function wait(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

function getRemainingTimeMs(startTime) {
  return TIME_BUDGET_MS - (Date.now() - startTime);
}

function canContinue(startTime) {
  return getRemainingTimeMs(startTime) > MIN_TIME_FOR_RETRY_MS;
}

function formatRemaining(startTime) {
  return `${Math.round(getRemainingTimeMs(startTime) / 1000)}s`;
}

function parseGeneratedArticle(responseText) {
  let generated;
  try {
    generated = JSON.parse(responseText);
  } catch (error) {
    throw new Error('Gemini returned invalid article metadata', { cause: error });
  }
  const article = typeof generated.article === "string" ? generated.article.replace(/^# [^\n]*$/gm, "").trim() : "";
  const description = typeof generated.description === 'string' ? generated.description.trim() : '';
  const tags = Array.isArray(generated.tags) ? [...new Set(generated.tags.filter(tag => typeof tag === 'string').map(tag => tag.trim()).filter(Boolean))].slice(0, 10) : [];
  if (!article || !description || tags.length === 0) throw new Error('Gemini returned incomplete article metadata');
  return { article, description, tags };
}

async function generateWithModel(client, modelName, prompt) {
  const model = client.getGenerativeModel({
    model: modelName,
    systemInstruction: systemPrompt,
    tools: [{ googleSearch: {} }],
    generationConfig: {
      temperature: 0.6,
      maxOutputTokens: 4096,
      responseMimeType: 'application/json',
    },
  });
  const result = await model.generateContentStream(prompt, { timeout: REQUEST_TIMEOUT_MS });
  let responseText = '';
  for await (const chunk of result.stream) {
    responseText += chunk.text();
  }
  return parseGeneratedArticle(responseText);
}

async function generateWithRetries(client, modelName, prompt, startTime) {
  for (let retry = 0; ; retry += 1) {
    const attempt = retry + 1;
    try {
      console.info(`Generating Gemini article with ${modelName} (attempt ${attempt}/${RETRY_DELAYS_MS.length + 1}, remaining ${formatRemaining(startTime)}).`);
      return await generateWithModel(client, modelName, prompt);
    } catch (error) {
      if (!isRetryableServerError(error) || retry >= RETRY_DELAYS_MS.length) throw error;
      if (!canContinue(startTime)) throw new Error(`AI generation time budget exhausted before retry (${modelName})`, { cause: error });
      const delay = RETRY_DELAYS_MS[retry];
      console.warn(`Gemini ${modelName} attempt ${attempt} failed; retrying in ${delay}ms.`);
      await wait(delay);
    }
  }
}

export async function generateWithGemini({
  title,
  category,
  targetProducts,
  availableProducts = [],
  existingArticles = [],
  onArticleChunk = () => {},
  options = {},
}) {
  const primaryModel = (options.model && String(options.model).trim()) || PRIMARY_MODEL;
  const fallbackModel = (options.fallbackModel && String(options.fallbackModel).trim()) || FALLBACK_MODEL;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');

  const startTime = Date.now();
  const client = new GoogleGenerativeAI(apiKey);
  const catalogContext = availableProducts.length
    ? `Konteks Katalog: Kamu HANYA boleh merekomendasikan produk dari daftar berikut: ${availableProducts.map(product => product.title).join(', ')}. JANGAN mengarang merek lain di luar daftar ini.`
    : 'Karena tidak ada produk spesifik yang diberikan, tulis artikel secara umum tanpa menyebut merek tertentu.';

  const productContext = targetProducts && targetProducts.length > 0
    ? `Fokus Utama Produk: Artikel ini membahas produk berikut: ${targetProducts.map(p => p.title).join(', ')}. Spesifikasi produk: ${JSON.stringify(targetProducts)}. Gunakan data ini sebagai fakta utama. PENTING: Setiap kali kamu menyebut nama produk dari daftar di atas, WAJIB tulis kode penanda [PRODUK:id-produk] tepat setelah nama produk tersebut.`
    : "";

  const prompt = `Buat artikel blog berdasarkan informasi berikut.\n\nJudul: ${title}\nKategori: ${category}\n\n${productContext}\n${catalogContext}\n\nKembalikan hanya JSON valid dengan format: {"article": "...", "description": "...", "tags": ["..."]}. Pastikan article dan description berupa string, tags berupa array string, dan jangan tambahkan teks di luar JSON.`;

  let generated;
  try {
    generated = await generateWithRetries(client, primaryModel, prompt, startTime);
  } catch (primaryError) {
    const primaryStatus = getHttpStatus(primaryError);
    if (primaryStatus === 400 || primaryStatus === 403 || (!isRetryableServerError(primaryError) && primaryStatus !== 404) || fallbackModel === primaryModel) throw primaryError;
    if (!canContinue(startTime)) throw new Error(`AI generation time budget exhausted before fallback (${primaryModel} -> ${fallbackModel})`, { cause: primaryError });
    console.warn(`Gemini ${primaryModel} failed with HTTP ${primaryStatus}; falling back to ${fallbackModel}.`);
    generated = await generateWithRetries(client, fallbackModel, prompt, startTime);
  }

  onArticleChunk(generated.article);
  return generated;
}
