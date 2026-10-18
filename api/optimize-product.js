export const maxDuration = 30;

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
const MAX_TITLE_LENGTH = 60;
const MAX_DESCRIPTION_LENGTH = 300;

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

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return response.status(503).json({ error: 'GEMINI_API_KEY is not configured' });
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
          },
        }),
      },
    );

    if (!geminiResponse.ok) {
      const details = await geminiResponse.text();
      console.error(
        `[optimize-product] Gemini request failed (HTTP ${geminiResponse.status}):`,
        details,
      );
      return response.status(502).json({ error: 'Gemini request failed' });
    }

    const result = await geminiResponse.json();
    const generatedText = result.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || '')
      .join('')
      .trim();

    if (!generatedText) {
      throw new Error('Gemini returned an empty response');
    }

    let optimized;
    try {
      optimized = JSON.parse(generatedText);
    } catch (error) {
      throw new Error('Gemini returned invalid JSON', { cause: error });
    }

    const optimizedTitle =
      typeof optimized.title === 'string' ? optimized.title.trim() : '';
    const optimizedDescription =
      typeof optimized.description === 'string'
        ? optimized.description.trim()
        : '';

    if (!optimizedTitle || !optimizedDescription) {
      throw new Error('Gemini response is missing title or description');
    }

    if (
      optimizedTitle.length > MAX_TITLE_LENGTH
      || optimizedDescription.length > MAX_DESCRIPTION_LENGTH
    ) {
      throw new Error('Gemini response exceeded the allowed text length');
    }

    return response.status(200).json({
      title: optimizedTitle,
      description: optimizedDescription,
    });
  } catch (error) {
    console.error('[optimize-product] Error:', error);
    return response.status(502).json({
      error: error instanceof Error
        ? error.message
        : 'Unable to optimize product text',
    });
  }
}
