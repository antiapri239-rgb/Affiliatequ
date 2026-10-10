import { listArticles } from '../lib/article-parser.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const articles = await listArticles({ skipDrafts: true });
    return res.status(200).json({
      articles: articles.map(a => ({
        title: a.title || '',
        category: a.category || 'Artikel',
        heroImage: a.heroImage || '',
      })),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
