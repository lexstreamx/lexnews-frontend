const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Token storage for browsers that block third-party cookies (Safari, etc.)
const TOKEN_KEY = 'lexstream_token';

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
}

function authFetchOpts(extra: RequestInit = {}): RequestInit {
  const opts: RequestInit = { credentials: 'include', ...extra };
  const token = getStoredToken();
  if (token) {
    opts.headers = { ...opts.headers as Record<string, string>, Authorization: `Bearer ${token}` };
  }
  return opts;
}

interface FetchArticlesParams {
  page?: number;
  limit?: number;
  feed_type?: string;
  categories?: string[];
  jurisdictions?: string[];
  courts?: string[];
  doc_types?: string[];
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
  if (params.courts && params.courts.length > 0) searchParams.set('court', params.courts.join(','));
  if (params.doc_types && params.doc_types.length > 0) searchParams.set('doc_type', params.doc_types.join(','));
  if (params.search) searchParams.set('search', params.search);
  if (params.saved_only) searchParams.set('saved_only', 'true');

  const res = await fetch(`${API_BASE}/articles?${searchParams.toString()}`, authFetchOpts());
  if (!res.ok) throw new Error('Failed to fetch articles');
  return res.json();
}

export async function fetchCategories() {
  const res = await fetch(`${API_BASE}/categories`, authFetchOpts());
  if (!res.ok) throw new Error('Failed to fetch categories');
  return res.json();
}

export async function saveArticle(id: number) {
  const res = await fetch(`${API_BASE}/articles/${id}/save`, authFetchOpts({ method: 'POST' }));
  if (!res.ok) throw new Error('Failed to save article');
  return res.json();
}

export async function unsaveArticle(id: number) {
  const res = await fetch(`${API_BASE}/articles/${id}/save`, authFetchOpts({ method: 'DELETE' }));
  if (!res.ok) throw new Error('Failed to unsave article');
  return res.json();
}

export async function markRead(id: number) {
  const res = await fetch(`${API_BASE}/articles/${id}/read`, authFetchOpts({ method: 'POST' }));
  if (!res.ok) throw new Error('Failed to mark article as read');
  return res.json();
}

export async function markUnread(id: number) {
  const res = await fetch(`${API_BASE}/articles/${id}/read`, authFetchOpts({ method: 'DELETE' }));
  if (!res.ok) throw new Error('Failed to mark article as unread');
  return res.json();
}

export async function fetchJurisdictions(): Promise<{ jurisdictions: string[] }> {
  const res = await fetch(`${API_BASE}/articles/jurisdictions`, authFetchOpts());
  if (!res.ok) throw new Error('Failed to fetch jurisdictions');
  return res.json();
}

export async function refreshFeeds() {
  const res = await fetch(`${API_BASE}/feeds/refresh`, authFetchOpts({ method: 'POST' }));
  if (!res.ok) throw new Error('Failed to refresh feeds');
  return res.json();
}

// Auth API functions
export async function fetchCurrentUser() {
  const res = await fetch(`${API_BASE}/auth/me`, authFetchOpts());
  if (res.status === 401) return null;
  if (!res.ok) throw new Error('Failed to fetch user');
  return res.json();
}

export async function logout() {
  const res = await fetch(`${API_BASE}/auth/logout`, authFetchOpts({ method: 'POST' }));
  clearStoredToken();
  if (!res.ok) throw new Error('Failed to logout');
  return res.json();
}

export async function loginWithEmail(email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, authFetchOpts({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  }));
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login failed');
  // Store token for browsers that block third-party cookies
  if (data.token) setStoredToken(data.token);
  return data;
}
