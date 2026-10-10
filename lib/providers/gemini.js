import { GoogleGenerativeAI } from '@google/generative-ai';

const systemPrompt = `Anda adalah penulis artikel blog berbahasa Indonesia yang ahli dalam dekorasi rumah dan interior estetik.
Gunakan bahasa yang santai, jelas, hangat, dan persuasif tanpa membuat klaim yang tidak berdasar.
Tulis dalam format Markdown, jangan gunakan heading H1 (#), dan sertakan poin-poin keunggulan atau tips yang relevan.
Susun artikel dengan pembuka yang menarik, beberapa heading H2/H3, isi yang praktis, dan penutup yang natural.
Selain isi artikel, buat deskripsi ringkas untuk ringkasan/SEO dan 5 tags relevan.
Kembalikan hanya JSON valid dengan bentuk {"article":"isi artikel Markdown","description":"ringkasan artikel","tags":["tag 1","tag 2"]}.
Jangan masukkan heading H1 ke dalam article dan jangan menambahkan teks di luar JSON.`;

const PRIMARY_MODEL = 'gemini-3.8-flash';
const FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL || 'gemini-3.6-flash';
const RETRY_DELAYS_MS = [1000, 2000, 4000];

// Time budget untuk mencegah Vercel timeout 60 detik.
const TIME_BUDGET_MS = Number(process.env.AI_TIME_BUDGET_MS) || 45000;
// Kalau sisa waktu kurang dari ini, jangan retry/fallback.
const MIN_TIME_FOR_RETRY_MS = 15000;

// Timeout per request ke Gemini. Kalau request menggantung lebih dari ini, SDK akan abort.
const REQUEST_TIMEOUT_MS = Number(process.env.AI_REQUEST_TIMEOUT_MS) || 20000;

function getHttpStatus(error) {
  return typeof error?.status === 'number' ? error.status : null;
}

function isRetryableServerError(error) {
  const status = getHttpStatus(error);
  if (status !== null && status >= 500 && status < 600) {
    return true;
  }
  // Bug @google/generative-ai 0.24.1: 503 dilempar sebagai "fetch failed" tanpa status.
  // Anggap fetch failed sebagai retryable karena Gemini sering overload.
  const message = error?.message || '';
  if (status === null && (message.includes('fetch failed') || message.includes('ECONNRESET') || message.includes('ETIMEDOUT'))) {
    return true;
  }
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

  const article = typeof generated.article === 'string'
    ? generated.article.replace(/^#\s+.*$/gm, '').trim()
    : '';
  const description = typeof generated.description === 'string' ? generated.description.trim() : '';
  const tags = Array.isArray(generated.tags)
    ? [...new Set(generated.tags.filter(tag => typeof tag === 'string').map(tag => tag.trim()).filter(Boolean))].slice(0, 10)
    : [];

  if (!article || !description || tags.length === 0) {
    throw new Error('Gemini returned incomplete article metadata');
  }

  return { article, description, tags };
}

async function generateWithModel(client, modelName, prompt) {
  const model = client.getGenerativeModel({
    model: modelName,
    systemInstruction: systemPrompt,
    generationConfig: {
      temperature: 0.75,
      maxOutputTokens: 2048,
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

// Retry transient Gemini server errors with exponential backoff; never retry 4xx errors.
async function generateWithRetries(client, modelName, prompt, startTime) {
  for (let retry = 0; ; retry += 1) {
    const attempt = retry + 1;
    try {
      console.info(
        `Generating Gemini article with ${modelName} (attempt ${attempt}/${RETRY_DELAYS_MS.length + 1}, remaining ${formatRemaining(startTime)}).`,
      );
      return await generateWithModel(client, modelName, prompt);
    } catch (error) {
      if (!isRetryableServerError(error) || retry >= RETRY_DELAYS_MS.length) {
        throw error;
      }

      if (!canContinue(startTime)) {
        console.warn(
          `Gemini ${modelName} attempt ${attempt} failed but time budget exhausted (remaining ${formatRemaining(startTime)}); aborting retry.`,
        );
        throw new Error(
          `AI generation time budget exhausted before retry (${modelName})`,
          { cause: error },
        );
      }

      const delay = RETRY_DELAYS_MS[retry];
      console.warn(
        `Gemini ${modelName} attempt ${attempt} failed with HTTP ${getHttpStatus(error) ?? 'network/fetch'}; retrying in ${delay}ms (remaining ${formatRemaining(startTime)}).`,
      );
      await wait(delay);
    }
  }
}

export async function generateWithGemini({ title, category, onArticleChunk = () => {}, options = {} }) {
  const primaryModel = (options.model && String(options.model).trim()) || PRIMARY_MODEL;
  const fallbackModel = (options.fallbackModel && String(options.fallbackModel).trim()) || FALLBACK_MODEL;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const startTime = Date.now();

  const client = new GoogleGenerativeAI(apiKey);
  const prompt = `Buat artikel blog berdasarkan informasi berikut.\n\nJudul: ${title}\nKategori: ${category}`;
  let generated;
  try {
    generated = await generateWithRetries(client, primaryModel, prompt, startTime);
  } catch (primaryError) {
    const primaryStatus = getHttpStatus(primaryError);
    if (
      primaryStatus === 400 ||
      primaryStatus === 403 ||
      (!isRetryableServerError(primaryError) && primaryStatus !== 404) ||
      fallbackModel === primaryModel
    ) {
      throw primaryError;
    }

    if (!canContinue(startTime)) {
      console.warn(
        `Gemini ${primaryModel} failed but time budget exhausted (remaining ${formatRemaining(startTime)}); aborting fallback.`,
      );
      throw new Error(
        `AI generation time budget exhausted before fallback (${primaryModel} -> ${fallbackModel})`,
        { cause: primaryError },
      );
    }

    console.warn(
      `Gemini ${primaryModel} failed with HTTP ${primaryStatus}; falling back to ${fallbackModel} (remaining ${formatRemaining(startTime)}).`,
    );
    generated = await generateWithRetries(client, fallbackModel, prompt, startTime);
  }

  onArticleChunk(generated.article);
  return generated;
}
