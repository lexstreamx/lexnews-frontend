const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const fetchOpts: RequestInit = { credentials: 'include' };

interface FetchArticlesParams {
  page?: number;
  limit?: number;
  feed_type?: string;
  categories?: string[];
  jurisdictions?: string[];
  search?: string;
  saved_only?: boolean;
}

export async function fetchArticles(params: FetchArticlesParams = {}) {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.feed_type && params.feed_type !== 'all') searchParams.set('feed_type', params.feed_type);
  if (params.categories && params.categories.length > 0) searchParams.set('category', params.categories.join(','));
  if (params.jurisdictions && params.jurisdictions.length > 0) searchParams.set('jurisdiction', params.jurisdictions.join(','));
  if (params.search) searchParams.set('search', params.search);
  if (params.saved_only) searchParams.set('saved_only', 'true');

  const res = await fetch(`${API_BASE}/articles?${searchParams.toString()}`, fetchOpts);
  if (!res.ok) throw new Error('Failed to fetch articles');
  return res.json();
}

export async function fetchCategories() {
  const res = await fetch(`${API_BASE}/categories`, fetchOpts);
  if (!res.ok) throw new Error('Failed to fetch categories');
  return res.json();
}

export async function saveArticle(id: number) {
  const res = await fetch(`${API_BASE}/articles/${id}/save`, { ...fetchOpts, method: 'POST' });
  if (!res.ok) throw new Error('Failed to save article');
  return res.json();
}

export async function unsaveArticle(id: number) {
  const res = await fetch(`${API_BASE}/articles/${id}/save`, { ...fetchOpts, method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to unsave article');
  return res.json();
}

export async function markRead(id: number) {
  const res = await fetch(`${API_BASE}/articles/${id}/read`, { ...fetchOpts, method: 'POST' });
  if (!res.ok) throw new Error('Failed to mark article as read');
  return res.json();
}

export async function markUnread(id: number) {
  const res = await fetch(`${API_BASE}/articles/${id}/read`, { ...fetchOpts, method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to mark article as unread');
  return res.json();
}

export async function fetchJurisdictions(): Promise<{ jurisdictions: string[] }> {
  const res = await fetch(`${API_BASE}/articles/jurisdictions`, fetchOpts);
  if (!res.ok) throw new Error('Failed to fetch jurisdictions');
  return res.json();
}

export async function refreshFeeds() {
  const res = await fetch(`${API_BASE}/feeds/refresh`, { ...fetchOpts, method: 'POST' });
  if (!res.ok) throw new Error('Failed to refresh feeds');
  return res.json();
}

// Auth API functions
export async function fetchCurrentUser() {
  const res = await fetch(`${API_BASE}/auth/me`, fetchOpts);
  if (res.status === 401) return null;
  if (!res.ok) throw new Error('Failed to fetch user');
  return res.json();
}

export async function logout() {
  const res = await fetch(`${API_BASE}/auth/logout`, { ...fetchOpts, method: 'POST' });
  if (!res.ok) throw new Error('Failed to logout');
  return res.json();
}

export async function loginWithEmail(email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    ...fetchOpts,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login failed');
  return data;
}
