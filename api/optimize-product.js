export const maxDuration = 30;

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const GEMINI_TIMEOUT_MS = 8000;
const GROQ_TIMEOUT_MS = 18000;
const MAX_TITLE_LENGTH = 60;
const MAX_DESCRIPTION_LENGTH = 300;

function parseOptimizedText(text, provider) {
  let optimized;
  try {
    optimized = JSON.parse(text);
  } catch (error) {
    throw new Error(`${provider} returned invalid JSON`, { cause: error });
  }

  const optimizedTitle =
    typeof optimized.title === 'string' ? optimized.title.trim() : '';
  const optimizedDescription =
    typeof optimized.description === 'string'
      ? optimized.description.trim()
      : '';

  if (!optimizedTitle || !optimizedDescription) {
    throw new Error(`${provider} response is missing title or description`);
  }

  if (
    optimizedTitle.length > MAX_TITLE_LENGTH
    || optimizedDescription.length > MAX_DESCRIPTION_LENGTH
  ) {
    throw new Error(`${provider} response exceeded the allowed text length`);
  }

  return { title: optimizedTitle, description: optimizedDescription };
}

async function requestGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

  try {
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.2,
            maxOutputTokens: 512,
            thinkingConfig: { thinkingLevel: 'low' },
          },
        }),
        signal: controller.signal,
      },
    );

    if (!geminiResponse.ok) {
      throw new Error(`Gemini request failed (HTTP ${geminiResponse.status})`);
    }

    const result = await geminiResponse.json();
    const generatedText = result.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || '')
      .join('')
      .trim();

    if (!generatedText) {
      throw new Error('Gemini returned an empty response');
    }

    return parseOptimizedText(generatedText, 'Gemini');
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error('Gemini request timed out after 8 seconds', { cause: error });
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function requestGroq(prompt) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not configured');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GROQ_TIMEOUT_MS);

  try {
    const groqResponse = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
          temperature: 0.2,
          max_tokens: 512,
        }),
        signal: controller.signal,
      },
    );

    if (!groqResponse.ok) {
      throw new Error(`Groq request failed (HTTP ${groqResponse.status})`);
    }

    const result = await groqResponse.json();
    const generatedText = result.choices?.[0]?.message?.content?.trim();
    if (!generatedText) {
      throw new Error('Groq returned an empty response');
    }

    return parseOptimizedText(generatedText, 'Groq');
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error('Groq request timed out after 18 seconds', { cause: error });
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const body = request.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return response.status(400).json({ error: 'A JSON object is required' });
  }

  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  const category = typeof body.category === 'string' ? body.category.trim() : '';

  if (!title || !description || !category) {
    return response.status(400).json({
      error: 'Title, description, and category are required',
    });
  }

  if (!process.env.GEMINI_API_KEY && !process.env.GROQ_API_KEY) {
    return response.status(503).json({
      error: 'Neither GEMINI_API_KEY nor GROQ_API_KEY is configured',
    });
  }

  const prompt = `Kamu adalah editor copywriting produk skincare yang teliti. Tugasmu merapikan judul dan deskripsi produk yang di-copy dari marketplace agar enak dibaca.

ATURAN KETAT:
1. Hapus kata duplikat (contoh: "Serum Serum" jadi "Serum").
2. Rapikan ejaan (EYD) dan huruf kapital.
3. JANGAN mengarang klaim/fakta baru yang tidak ada di teks asli.
4. Panjang JUDUL maksimal 60 karakter.
5. Panjang DESKRIPSI maksimal 300 karakter (sekitar 50-60 kata).
6. Balas HANYA dengan format JSON murni: {"title": "...", "description": "..."} (tanpa markdown block seperti \`\`\`json).
7. Sesuaikan gaya bahasa dengan kategori produk.

Teks Asli:
Judul: ${title}
Deskripsi: ${description}
Kategori: ${category}`;

  try {
    const optimized = await requestGemini(prompt);
    return response.status(200).json(optimized);
  } catch (error) {
    console.error('[optimize-product] Gemini failed; trying Groq fallback:', error);
  }

  try {
    const optimized = await requestGroq(prompt);
    return response.status(200).json(optimized);
  } catch (error) {
    console.error('[optimize-product] Groq fallback failed:', error);
    return response.status(502).json({
      error: 'Text optimization failed with both Gemini and Groq',
    });
  }
}
