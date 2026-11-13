export const prerender = false;

import { listArticles } from '../../../lib/article-parser.js';

export const GET = async () => {
  try {
    const articles = await listArticles({ skipDrafts: true });
    
    return new Response(JSON.stringify({
      articles: articles.map(a => ({
        slug: a.slug || '',
        title: a.title || '',
        category: a.category || 'Artikel',
        heroImage: a.heroImage || '',
      })),
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
};
