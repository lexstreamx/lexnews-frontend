const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface FetchArticlesParams {
  page?: number;
  limit?: number;
  feed_type?: string;
  category?: string;
  jurisdiction?: string;
  search?: string;
  saved_only?: boolean;
}

export async function fetchArticles(params: FetchArticlesParams = {}) {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.feed_type && params.feed_type !== 'all') searchParams.set('feed_type', params.feed_type);
  if (params.category) searchParams.set('category', params.category);
  if (params.jurisdiction) searchParams.set('jurisdiction', params.jurisdiction);
  if (params.search) searchParams.set('search', params.search);
  if (params.saved_only) searchParams.set('saved_only', 'true');

  const res = await fetch(`${API_BASE}/articles?${searchParams.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch articles');
  return res.json();
}

export async function fetchCategories() {
  const res = await fetch(`${API_BASE}/categories`);
  if (!res.ok) throw new Error('Failed to fetch categories');
  return res.json();
}

export async function saveArticle(id: number) {
  const res = await fetch(`${API_BASE}/articles/${id}/save`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to save article');
  return res.json();
}

export async function unsaveArticle(id: number) {
  const res = await fetch(`${API_BASE}/articles/${id}/save`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to unsave article');
  return res.json();
}

export async function refreshFeeds() {
  const res = await fetch(`${API_BASE}/feeds/refresh`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to refresh feeds');
  return res.json();
}
