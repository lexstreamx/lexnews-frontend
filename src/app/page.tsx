'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import SearchBar from '@/components/SearchBar';
import FilterBar from '@/components/FilterBar';
import ArticleCard from '@/components/ArticleCard';
import ArticleDetailPanel from '@/components/ArticleDetailPanel';
import LoginScreen from '@/components/LoginScreen';
import { useAuth } from '@/lib/auth-context';
import { fetchArticles, fetchCategories, fetchJurisdictions, markRead } from '@/lib/api';
import { Article, Category, FeedType, ViewMode } from '@/types';

export default function Home() {
  const { user, loading: authLoading, logout } = useAuth();

  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // View mode
  const [viewMode, setViewMode] = useState<ViewMode>('card');

  // Filters
  const [feedType, setFeedType] = useState<FeedType>('all');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [jurisdictions, setJurisdictions] = useState<string[]>([]);
  const [selectedJurisdictions, setSelectedJurisdictions] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSaved, setShowSaved] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [filtersReady, setFiltersReady] = useState(false);
  const initialCategoriesSet = useRef(false);

  // Pre-select user's categories from their LearnWorlds tags, then mark ready
  useEffect(() => {
    if (user) {
      if (user.category_slugs.length > 0 && !initialCategoriesSet.current) {
        setSelectedCategories(user.category_slugs);
        initialCategoriesSet.current = true;
      }
      setFiltersReady(true);
    }
  }, [user]);

  // Load view mode and sidebar state from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('lexnews-view-mode');
    if (stored === 'card' || stored === 'list') {
      setViewMode(stored);
    }
    const sb = localStorage.getItem('lexnews-sidebar');
    if (sb === 'closed') setSidebarOpen(false);
  }, []);

  function handleSidebarToggle() {
    const next = !sidebarOpen;
    setSidebarOpen(next);
    localStorage.setItem('lexnews-sidebar', next ? 'open' : 'closed');
  }

  const loadArticles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchArticles({
        page,
        limit: 30,
        feed_type: feedType !== 'all' ? feedType : undefined,
        categories: selectedCategories.length > 0 ? selectedCategories : undefined,
        jurisdictions: selectedJurisdictions.length > 0 ? selectedJurisdictions : undefined,
        search: searchQuery || undefined,
        saved_only: showSaved || undefined,
      });
      setArticles(data.articles);
      setTotalPages(data.pagination.pages);
    } catch {
      setError('Failed to load articles. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }, [page, feedType, selectedCategories, selectedJurisdictions, searchQuery, showSaved]);

  const loadFilters = useCallback(async () => {
    try {
      const [catData, jurData] = await Promise.all([fetchCategories(), fetchJurisdictions()]);
      setCategories(catData.categories);
      setJurisdictions(jurData.jurisdictions);
    } catch {
      // Filters will just be empty
    }
  }, []);

  const isLoggedIn = !!user;

  useEffect(() => {
    if (isLoggedIn) loadFilters();
  }, [isLoggedIn, loadFilters]);

  useEffect(() => {
    if (filtersReady) loadArticles();
  }, [filtersReady, loadArticles]);

  // Reset page and close panel when filters change
  useEffect(() => {
    setPage(1);
    setSelectedArticle(null);
  }, [feedType, selectedCategories, selectedJurisdictions, searchQuery, showSaved]);

  function handleSearch(query: string) {
    setSearchQuery(query);
  }

  function handleSelectArticle(article: Article) {
    setSelectedArticle(article);
    if (!article.is_read) {
      markRead(article.id).catch(() => {});
      setArticles(prev => prev.map(a => a.id === article.id ? { ...a, is_read: true } : a));
    }
  }

  function handleReadChange(article: Article, isRead: boolean) {
    setArticles(prev => prev.map(a => a.id === article.id ? { ...a, is_read: isRead } : a));
  }

  function handleCategoryClick(slug: string) {
    setSelectedCategories(prev =>
      prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
    );
  }

  // Show loading spinner while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg">
        <div className="flex flex-col items-center gap-4">
          <svg viewBox="0 0 80 100" className="w-10 h-12 text-brand-accent animate-pulse">
            <circle cx="40" cy="35" r="30" fill="currentColor" />
            <rect x="12" y="75" width="56" height="14" rx="3" fill="currentColor" />
          </svg>
          <p className="text-brand-muted text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login screen if not authenticated
  if (!user) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen">
      <main className={`mx-auto px-4 py-6 ${selectedArticle ? 'max-w-[1600px]' : viewMode === 'card' ? 'max-w-7xl' : 'max-w-5xl'}`}>
        <div className={`grid grid-cols-1 ${
          sidebarOpen
            ? (selectedArticle ? 'lg:grid-cols-[280px_1fr_380px]' : 'lg:grid-cols-[280px_1fr]')
            : (selectedArticle ? 'lg:grid-cols-[56px_1fr_380px]' : 'lg:grid-cols-[56px_1fr]')
        } gap-6`}>
          {/* Sidebar */}
          <aside className={`overflow-visible ${!sidebarOpen ? 'relative z-10' : ''}`}>
            <div className={`bg-brand-body rounded-xl lg:sticky lg:top-6 overflow-visible ${sidebarOpen ? 'p-4' : 'p-4 lg:py-3 lg:px-2'}`}>
              {/* Toggle button - desktop only */}
              <div className={`hidden lg:flex ${sidebarOpen ? 'justify-end' : 'justify-center'} mb-3`}>
                <button
                  onClick={handleSidebarToggle}
                  className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                  title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    {sidebarOpen ? (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    )}
                  </svg>
                </button>
              </div>

              {/* Expanded content - always on mobile, conditional on desktop */}
              <div className={`space-y-4 ${!sidebarOpen ? 'lg:hidden' : ''}`}>
                {/* Logo */}
                <div className="flex items-center gap-2.5 px-1">
                  <svg viewBox="0 0 80 100" className="w-7 h-9 text-brand-accent flex-shrink-0">
                    <circle cx="40" cy="35" r="30" fill="currentColor" />
                    <rect x="12" y="75" width="56" height="14" rx="3" fill="currentColor" />
                  </svg>
                  <span className="font-heading text-base font-bold text-brand-accent tracking-tight">LexStream</span>
                </div>
                <SearchBar onSearch={handleSearch} initialQuery={searchQuery} dark />
                <FilterBar
                  categories={categories}
                  jurisdictions={jurisdictions}
                  selectedFeedType={feedType}
                  selectedCategories={selectedCategories}
                  selectedJurisdictions={selectedJurisdictions}
                  onFeedTypeChange={setFeedType}
                  onCategoriesChange={setSelectedCategories}
                  onJurisdictionsChange={setSelectedJurisdictions}
                  dark
                />

                {/* Saved articles */}
                <button
                  onClick={() => setShowSaved(!showSaved)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    showSaved
                      ? 'bg-brand-accent text-white'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={showSaved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={showSaved ? 0 : 1.5} className="w-4 h-4 flex-shrink-0">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
                  </svg>
                  Saved for Later
                </button>

                {/* User info */}
                <div className="border-t border-white/15 pt-3 mt-2">
                  <div className="flex items-center gap-2.5 px-1">
                    <div className="w-7 h-7 rounded-full bg-brand-accent/20 text-brand-accent flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {(user.display_name || user.email)[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-medium truncate">{user.display_name || user.email}</p>
                    </div>
                    <button
                      onClick={logout}
                      className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                      title="Sign out"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Collapsed icons - desktop only when collapsed */}
              {!sidebarOpen && (
                <div className="hidden lg:flex flex-col items-center gap-1">
                  {/* Logo icon */}
                  <svg viewBox="0 0 80 100" className="w-7 h-9 text-brand-accent mb-1">
                    <circle cx="40" cy="35" r="30" fill="currentColor" />
                    <rect x="12" y="75" width="56" height="14" rx="3" fill="currentColor" />
                  </svg>
                  <div className="w-6 border-t border-white/15 my-1" />
                  {/* Search */}
                  <div className="relative group">
                    <button
                      onClick={handleSidebarToggle}
                      className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                      </svg>
                    </button>
                    <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-brand-accent text-white text-xs font-medium rounded-md whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-lg z-50">Search</span>
                  </div>

                  <div className="w-6 border-t border-white/15 my-1" />

                  {/* Feed type icons */}
                  {([
                    { value: 'all' as FeedType, label: 'All', path: 'M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z' },
                    { value: 'news' as FeedType, label: 'News', path: 'M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5M6 7.5h3v3H6v-3Z' },
                    { value: 'blogpost' as FeedType, label: 'Blogposts', path: 'M16.862 4.487l1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10' },
                    { value: 'judgment' as FeedType, label: 'Caselaw', path: 'M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0 0 12 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 0 1-2.031.352 5.988 5.988 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971Zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 0 1-2.031.352 5.989 5.989 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971Z' },
                    { value: 'regulatory' as FeedType, label: 'Regulatory', path: 'M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z' },
                  ]).map((ft) => (
                    <div key={ft.value} className="relative group">
                      <button
                        onClick={() => setFeedType(ft.value)}
                        className={`p-2 rounded-lg transition-colors ${
                          feedType === ft.value
                            ? 'bg-brand-accent text-white'
                            : 'text-white/60 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d={ft.path} />
                        </svg>
                      </button>
                      <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-brand-accent text-white text-xs font-medium rounded-md whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-lg z-50">{ft.label}</span>
                    </div>
                  ))}

                  <div className="w-6 border-t border-white/15 my-1" />

                  {/* Jurisdiction */}
                  <div className="relative group">
                    <button
                      onClick={handleSidebarToggle}
                      className={`p-2 rounded-lg transition-colors relative ${
                        selectedJurisdictions.length > 0 ? 'text-brand-accent' : 'text-white/60 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
                      </svg>
                      {selectedJurisdictions.length > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-brand-accent text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                          {selectedJurisdictions.length}
                        </span>
                      )}
                    </button>
                    <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-brand-accent text-white text-xs font-medium rounded-md whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-lg z-50">Jurisdiction</span>
                  </div>

                  {/* Areas of Law */}
                  <div className="relative group">
                    <button
                      onClick={handleSidebarToggle}
                      className={`p-2 rounded-lg transition-colors relative ${
                        selectedCategories.length > 0 ? 'text-brand-accent' : 'text-white/60 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
                      </svg>
                      {selectedCategories.length > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-brand-accent text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                          {selectedCategories.length}
                        </span>
                      )}
                    </button>
                    <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-brand-accent text-white text-xs font-medium rounded-md whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-lg z-50">Areas of Law</span>
                  </div>

                  {/* Saved */}
                  <div className="relative group">
                    <button
                      onClick={() => setShowSaved(!showSaved)}
                      className={`p-2 rounded-lg transition-colors cursor-pointer ${
                        showSaved ? 'bg-brand-accent text-white' : 'text-white/60 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={showSaved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={showSaved ? 0 : 1.5} className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
                      </svg>
                    </button>
                    <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-brand-accent text-white text-xs font-medium rounded-md whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-lg z-50">Saved</span>
                  </div>

                  {/* Spacer + user avatar + logout */}
                  <div className="flex-1" />
                  <div className="w-6 border-t border-white/15 my-1" />
                  <div className="relative group">
                    <button
                      onClick={logout}
                      className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
                      </svg>
                    </button>
                    <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-brand-accent text-white text-xs font-medium rounded-md whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-lg z-50">Sign out</span>
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* Articles area */}
          <div>
            {/* View toggle + Active filters summary */}
            <div className="flex items-center justify-between pb-3">
              <div className="flex items-center gap-2 text-sm text-brand-muted flex-wrap flex-1 min-w-0">
            {(feedType !== 'all' || selectedCategories.length > 0 || selectedJurisdictions.length > 0 || searchQuery || showSaved) && (
              <>
                <span>Showing:</span>
                {showSaved && <span className="px-2 py-0.5 bg-brand-accent/10 text-brand-accent rounded text-xs font-medium">Saved only</span>}
                {feedType !== 'all' && <span className="px-2 py-0.5 bg-brand-body/10 text-brand-body rounded text-xs font-medium">{feedType}</span>}
                {selectedCategories.map(slug => {
                  const cat = categories.find(c => c.slug === slug);
                  return (
                    <button
                      key={slug}
                      onClick={() => setSelectedCategories(prev => prev.filter(s => s !== slug))}
                      className="px-2 py-0.5 bg-brand-accent/10 text-brand-accent rounded text-xs font-medium hover:bg-brand-accent hover:text-white transition-colors flex items-center gap-1"
                    >
                      {cat?.name || slug}
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                      </svg>
                    </button>
                  );
                })}
                {selectedJurisdictions.length > 0 && <span className="px-2 py-0.5 bg-brand-body/10 text-brand-body rounded text-xs font-medium">{selectedJurisdictions.join(', ')}</span>}
                {searchQuery && <span className="px-2 py-0.5 bg-brand-body/10 text-brand-body rounded text-xs font-medium">&ldquo;{searchQuery}&rdquo;</span>}
                <button
                  onClick={() => {
                    setFeedType('all');
                    setSelectedCategories([]);
                    setSelectedJurisdictions([]);
                    setSearchQuery('');
                    setShowSaved(false);
                  }}
                  className="text-xs text-brand-accent hover:underline"
                >
                  Clear all
                </button>
              </>
            )}
              </div>

              {/* Card/List view toggle */}
              <div className="flex items-center gap-1 ml-3 flex-shrink-0">
                <button
                  onClick={() => { setViewMode('card'); localStorage.setItem('lexnews-view-mode', 'card'); }}
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${viewMode === 'card' ? 'bg-brand-body text-white' : 'text-brand-muted hover:text-brand-body hover:bg-brand-bg-hover'}`}
                  title="Card view"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z" />
                  </svg>
                </button>
                <button
                  onClick={() => { setViewMode('list'); localStorage.setItem('lexnews-view-mode', 'list'); }}
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${viewMode === 'list' ? 'bg-brand-body text-white' : 'text-brand-muted hover:text-brand-body hover:bg-brand-bg-hover'}`}
                  title="List view"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Error state */}
            {error && (
              <div className="text-center py-8 text-sm text-red-600 bg-red-50 rounded-lg border border-red-200 px-4">
                {error}
              </div>
            )}

            {/* Loading skeletons */}
            {loading && !error && (
              viewMode === 'card' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-white border border-brand-border rounded-xl overflow-hidden animate-pulse">
                      <div className="aspect-video bg-brand-border" />
                      <div className="p-4 space-y-2">
                        <div className="h-5 w-3/4 bg-brand-border rounded" />
                        <div className="h-4 w-full bg-brand-border/60 rounded" />
                        <div className="h-4 w-2/3 bg-brand-border/60 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="bg-white border border-brand-border rounded-lg p-4 animate-pulse flex gap-4">
                      <div className="w-24 h-24 bg-brand-border rounded-lg flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-5 w-16 bg-brand-border rounded-full" />
                        <div className="h-5 w-3/4 bg-brand-border rounded" />
                        <div className="h-4 w-full bg-brand-border/60 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* Empty state */}
            {!loading && !error && articles.length === 0 && (
              <div className="text-center py-12 text-brand-muted">
                <p className="text-lg font-heading font-semibold mb-1">No articles found</p>
                <p className="text-sm">Try adjusting your filters or refresh the feeds.</p>
              </div>
            )}

            {/* Articles */}
            {!loading && !error && articles.length > 0 && (
              viewMode === 'card' ? (
                <div className={`grid grid-cols-1 md:grid-cols-2 ${selectedArticle ? '' : 'xl:grid-cols-3'} gap-4`}>
                  {articles.map((a) => (
                    <ArticleCard key={a.id} article={a} view="card" onSelect={handleSelectArticle} isSelected={selectedArticle?.id === a.id} onReadChange={handleReadChange} onCategoryClick={handleCategoryClick} />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {articles.map((a) => (
                    <ArticleCard key={a.id} article={a} view="list" onSelect={handleSelectArticle} isSelected={selectedArticle?.id === a.id} onReadChange={handleReadChange} onCategoryClick={handleCategoryClick} />
                  ))}
                </div>
              )
            )}

            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 py-4">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1.5 text-sm border border-brand-border rounded-lg hover:bg-brand-bg-hover disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-brand-muted">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page >= totalPages}
                  className="px-3 py-1.5 text-sm border border-brand-border rounded-lg hover:bg-brand-bg-hover disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </div>

          {/* Detail panel */}
          {selectedArticle && (
            <ArticleDetailPanel
              article={selectedArticle}
              onClose={() => setSelectedArticle(null)}
            />
          )}
        </div>
      </main>
    </div>
  );
}
