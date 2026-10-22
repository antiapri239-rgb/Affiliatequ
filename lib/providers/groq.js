import Groq from 'groq-sdk';
import { buildUserPrompt } from '../prompt-helpers.js';

const systemPrompt = `Anda adalah "Kak Rianti", beauty blogger santai. Tugas: Tulis ulasan skincare yang SINGKAT, PADAT, dan TO THE POINT (maksimal 400-500 kata).

Aturan:
1. Pembuka 1 paragraf relatable.
2. Langsung bahas produk (tekstur, kegunaan) pakai bullet points.
3. Wajib ada "Kelebihan & Kekurangan" secara singkat.
4. Penutup 1 paragraf.
5. Jangan bertele-tele, pembaca Indonesia suka baca cepat.
6. PENTING: Setiap produk yang diberikan WAJIB diberi penanda [PRODUK:id] di baris sendiri setelah bagian yang membahasnya, dengan id persis dari daftar produk. Aturan ini tidak boleh dikorbankan demi keringkasan.

Output JSON valid: {"article": "...", "description": "...", "tags": ["..."]}`;

const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const RETRY_DELAYS_MS = [1000, 2000, 4000];
const TIME_BUDGET_MS = Number(process.env.AI_TIME_BUDGET_MS) || 45000;
const MIN_TIME_FOR_RETRY_MS = 15000;
const REQUEST_TIMEOUT_MS = Number(process.env.AI_REQUEST_TIMEOUT_MS) || 20000;

function getHttpStatus(error) {
  if (typeof error?.status === 'number') return error.status;
  if (typeof error?.response?.status === 'number') return error.response.status;
  return null;
}

function isRetryableServerError(error) {
  const status = getHttpStatus(error);
  if (status !== null && ((status >= 500 && status < 600) || status === 429)) return true;
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
    throw new Error('Groq returned invalid article metadata', { cause: error });
  }
  const article = typeof generated.article === 'string' ? generated.article.replace(/^# [^\n]*$/gm, '').trim() : '';
  const description = typeof generated.description === 'string' ? generated.description.trim() : '';
  const tags = Array.isArray(generated.tags) ? [...new Set(generated.tags.filter(tag => typeof tag === 'string').map(tag => tag.trim()).filter(Boolean))].slice(0, 10) : [];
  if (!article || !description || tags.length === 0) throw new Error('Groq returned incomplete article metadata');
  return { article, description, tags };
}

async function generateWithModel(client, modelName, prompt) {
  const completion = await client.chat.completions.create({
    model: modelName,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
    temperature: 0.6,
    max_tokens: 4096,
    response_format: { type: 'json_object' },
  });
  const responseText = completion?.choices?.[0]?.message?.content || '';
  return parseGeneratedArticle(responseText);
}

async function generateWithRetries(client, modelName, prompt, startTime) {
  for (let retry = 0; ; retry += 1) {
    const attempt = retry + 1;
    try {
      console.info(`Generating Groq article with ${modelName} (attempt ${attempt}/${RETRY_DELAYS_MS.length + 1}, remaining ${formatRemaining(startTime)}).`);
      return await generateWithModel(client, modelName, prompt);
    } catch (error) {
      if (!isRetryableServerError(error) || retry >= RETRY_DELAYS_MS.length) throw error;
      if (!canContinue(startTime)) throw new Error(`AI generation time budget exhausted before retry (groq:${modelName})`, { cause: error });
      const delay = RETRY_DELAYS_MS[retry];
      console.warn(`Groq ${modelName} attempt ${attempt} failed; retrying in ${delay}ms.`);
      await wait(delay);
    }
  }
}

export async function generateWithGroq({
  title,
  category,
  targetProducts,
  availableProducts = [],
  existingArticles = [],
  onArticleChunk = () => {},
  options = {},
}) {
  const model = (options.model && String(options.model).trim()) || GROQ_MODEL;
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY is not configured');

  const startTime = Date.now();
  const client = new Groq({ apiKey, timeout: REQUEST_TIMEOUT_MS, maxRetries: 0 });
  const prompt = buildUserPrompt({ title, category, targetProducts, availableProducts });

  const generated = await generateWithRetries(client, model, prompt, startTime);

  onArticleChunk(generated.article);
  return generated;
}
