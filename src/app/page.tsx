'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import SearchBar from '@/components/SearchBar';
import FilterBar from '@/components/FilterBar';
import ArticleCard from '@/components/ArticleCard';
import ArticleDetailPanel from '@/components/ArticleDetailPanel';
import DigestSettings from '@/components/DigestSettings';
import MultiSelectDropdown from '@/components/MultiSelectDropdown';
import LoginScreen from '@/components/LoginScreen';
import { useAuth } from '@/lib/auth-context';
import { fetchArticles, fetchCategories, fetchJurisdictions, markRead, changePassword, updatePreferences } from '@/lib/api';
import { Article, Category, FeedType, ViewMode, DateFilter } from '@/types';

// Curated jurisdiction list for Account Settings (matches onboarding)
const SETTINGS_JURISDICTIONS = [
  'EU', 'Portugal', 'Austria', 'Belgium', 'Bulgaria', 'Croatia', 'Cyprus',
  'Czech Republic', 'Denmark', 'Estonia', 'Finland', 'France', 'Germany',
  'Greece', 'Hungary', 'Ireland', 'Italy', 'Latvia', 'Lithuania', 'Luxembourg',
  'Malta', 'Netherlands', 'Poland', 'Romania', 'Slovakia', 'Slovenia', 'Spain',
  'Sweden', 'Norway', 'Switzerland', 'UK', 'International',
];

export default function Home() {
  const { user, loading: authLoading, logout, setUser } = useAuth();
  const router = useRouter();

  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // View mode
  const [viewMode, setViewMode] = useState<ViewMode>('card');

  // Filters
  const [feedType, setFeedType] = useState<FeedType>('news');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [jurisdictions, setJurisdictions] = useState<string[]>([]);
  const [selectedJurisdictions, setSelectedJurisdictions] = useState<string[]>([]);
  const [selectedCourts, setSelectedCourts] = useState<string[]>([]);
  const [selectedDocTypes, setSelectedDocTypes] = useState<string[]>([]);
  const [selectedInstruments, setSelectedInstruments] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSaved, setShowSaved] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateFilter>({ preset: 'all' });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showDigestSettings, setShowDigestSettings] = useState(false);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [filtersReady, setFiltersReady] = useState(false);
  const initialCategoriesSet = useRef(false);
  const initialJurisdictionsSet = useRef(false);

  // Pre-select user's categories from their LearnWorlds tags
  useEffect(() => {
    if (user && user.category_slugs.length > 0 && !initialCategoriesSet.current) {
      setSelectedCategories(user.category_slugs);
      initialCategoriesSet.current = true;
    }
  }, [user]);

  // Pre-select jurisdictions once both user and available jurisdictions are loaded
  useEffect(() => {
    if (!user || initialJurisdictionsSet.current) {
      if (user) setFiltersReady(true);
      return;
    }
    if (jurisdictions.length === 0) return; // Wait for jurisdictions to load

    if (user.jurisdiction && jurisdictions.includes(user.jurisdiction)) {
      setSelectedJurisdictions([user.jurisdiction, 'EU', 'International'].filter(j => jurisdictions.includes(j)));
    } else {
      setSelectedJurisdictions(['EU', 'International', 'US'].filter(j => jurisdictions.includes(j)));
    }
    initialJurisdictionsSet.current = true;
    setFiltersReady(true);
  }, [user, jurisdictions]);

  // Load view mode and sidebar state from localStorage (with try/catch for in-app browsers)
  useEffect(() => {
    try {
      const stored = localStorage.getItem('lexnews-view-mode');
      if (stored === 'card' || stored === 'list') setViewMode(stored);
    } catch {}
    try {
      const sb = localStorage.getItem('lexnews-sidebar');
      if (sb === 'closed') {
        setSidebarOpen(false);
      } else if (sb === null && window.innerWidth < 1024) {
        setSidebarOpen(false);
      }
    } catch {
      // In-app browsers: default to closed
      if (typeof window !== 'undefined' && window.innerWidth < 1024) setSidebarOpen(false);
    }
  }, []);

  // Mobile search bar toggle
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  function handleSidebarToggle() {
    const next = !sidebarOpen;
    setSidebarOpen(next);
    try { localStorage.setItem('lexnews-sidebar', next ? 'open' : 'closed'); } catch {}
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
        courts: selectedCourts.length > 0 ? selectedCourts : undefined,
        doc_types: selectedDocTypes.length > 0 ? selectedDocTypes : undefined,
        competition_instruments: selectedInstruments.length > 0 ? selectedInstruments : undefined,
        search: searchQuery || undefined,
        saved_only: showSaved || undefined,
        date_range: dateFilter.preset !== 'all' && dateFilter.preset !== 'custom'
          ? dateFilter.preset
          : undefined,
        date_from: dateFilter.preset === 'custom' && dateFilter.from
          ? dateFilter.from
          : undefined,
        date_to: dateFilter.preset === 'custom' && dateFilter.to
          ? dateFilter.to
          : undefined,
      });
      setArticles(data.articles);
      setTotalPages(data.pagination.pages);
    } catch {
      setError('Failed to load articles. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }, [page, feedType, selectedCategories, selectedJurisdictions, selectedCourts, selectedDocTypes, selectedInstruments, searchQuery, showSaved, dateFilter]);

  const loadFilters = useCallback(async () => {
    try {
      const [catData, jurData] = await Promise.all([fetchCategories(), fetchJurisdictions()]);
      setCategories(catData.categories);
      setJurisdictions(jurData.jurisdictions);
    } catch {
      // Filters failed to load — still mark ready so articles can load
      setFiltersReady(true);
    }
  }, []);

  const isLoggedIn = !!user;
  const deepLinkHandled = useRef(false);

  useEffect(() => {
    if (isLoggedIn) loadFilters();
  }, [isLoggedIn, loadFilters]);

  useEffect(() => {
    if (filtersReady) loadArticles();
  }, [filtersReady, loadArticles]);

  // Handle ?article=ID deep-link (from shared article page or post-signup redirect)
  // Runs after filtersReady so initial filter setup won't clear the selected article
  useEffect(() => {
    if (!filtersReady || deepLinkHandled.current) return;
    const params = new URLSearchParams(window.location.search);
    let articleId = params.get('article');
    // Also check sessionStorage (set when user clicks CTA on shared article page)
    if (!articleId) {
      try {
        const stored = sessionStorage.getItem('lexlens_redirect_article');
        if (stored) {
          articleId = stored;
          sessionStorage.removeItem('lexlens_redirect_article');
        }
      } catch {}
    }
    if (!articleId) return;
    deepLinkHandled.current = true;
    // Clean URL
    window.history.replaceState({}, '', '/');
    // Fetch article from public endpoint and open it
    const API = process.env.NEXT_PUBLIC_API_URL || 'https://lexnews-backend-d0f19fef512a.herokuapp.com/api';
    fetch(`${API}/public/articles/${articleId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.article) {
          const a = data.article;
          setSelectedArticle({
            ...a,
            categories: a.categories || [],
            is_saved: false,
            is_read: false,
            is_important: false,
            important_count: a.important_count || 0,
          } as Article);
        }
      })
      .catch(() => {});
  }, [filtersReady]);

  // Reset page and close panel when filters change
  useEffect(() => {
    setPage(1);
    setSelectedArticle(null);
  }, [feedType, selectedCategories, selectedJurisdictions, selectedCourts, selectedDocTypes, selectedInstruments, searchQuery, showSaved, dateFilter]);

  // Clear Portuguese court selections when Portugal is deselected from jurisdictions
  const PT_COURT_NAMES = [
    'Supremo Tribunal de Justiça', 'Supremo Tribunal Administrativo',
    'Tribunal da Relação de Lisboa', 'Tribunal da Relação do Porto',
    'Tribunal da Relação de Coimbra', 'Tribunal da Relação de Évora',
    'Tribunal da Relação de Guimarães', 'Tribunal Central Administrativo Sul',
    'Tribunal Central Administrativo Norte',
  ];
  useEffect(() => {
    if (!selectedJurisdictions.includes('Portugal') && selectedCourts.length > 0) {
      const remaining = selectedCourts.filter(c => !PT_COURT_NAMES.includes(c));
      if (remaining.length !== selectedCourts.length) {
        setSelectedCourts(remaining);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedJurisdictions]);

  function handleFeedTypeChange(type: FeedType) {
    setFeedType(type);
    // Clear feed-specific sub-filters when switching feed types
    if (type !== 'judgment') {
      setSelectedCourts([]);
      setSelectedDocTypes([]);
    }
    if (type !== 'competition') {
      setSelectedInstruments([]);
    }
  }

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

  function handleImportantChange(articleId: number, isImportant: boolean, importantCount: number) {
    setArticles(prev => prev.map(a => a.id === articleId ? { ...a, is_important: isImportant, important_count: importantCount } : a));
    setSelectedArticle(prev => prev && prev.id === articleId ? { ...prev, is_important: isImportant, important_count: importantCount } : prev);
  }

  function handleSaveChange(articleId: number, isSaved: boolean) {
    setArticles(prev => prev.map(a => a.id === articleId ? { ...a, is_saved: isSaved } : a));
    setSelectedArticle(prev => prev && prev.id === articleId ? { ...prev, is_saved: isSaved } : prev);
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

  // Redirect standalone users who haven't completed onboarding
  if (user.auth_provider === 'standalone' && !user.onboarding_completed) {
    router.push('/onboarding');
    return null;
  }

  return (
    <div className="min-h-screen">
      {/* ── Mobile Header Bar ── */}
      <header className="fixed top-0 inset-x-0 z-30 bg-brand-sidebar lg:hidden">
        <div className="flex items-center justify-between px-4 h-14">
          <img src="/logo-white.svg" alt="LexLens" className="h-7" />
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              className="p-2.5 rounded-lg text-[#8A9A7C] hover:text-white transition-colors"
              title="Search"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </button>
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2.5 rounded-lg text-[#8A9A7C] hover:text-white transition-colors"
              title="Filters"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
              </svg>
            </button>
          </div>
        </div>
        {/* Mobile search dropdown */}
        {mobileSearchOpen && (
          <div className="px-4 pb-3">
            <SearchBar onSearch={(q) => { handleSearch(q); setMobileSearchOpen(false); }} initialQuery={searchQuery} dark />
          </div>
        )}
      </header>

      {/* ── Mobile Sidebar Overlay ── */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <main className={`mx-auto px-4 pt-16 pb-4 lg:pt-6 lg:pb-6 ${selectedArticle ? 'max-w-[1800px]' : viewMode === 'card' ? 'max-w-7xl' : 'max-w-5xl'}`}>
        <div className={`grid grid-cols-1 ${
          sidebarOpen
            ? (selectedArticle ? 'lg:grid-cols-[280px_1fr_520px]' : 'lg:grid-cols-[280px_1fr]')
            : (selectedArticle ? 'lg:grid-cols-[56px_1fr_520px]' : 'lg:grid-cols-[56px_1fr]')
        } gap-6`}>
          {/* Sidebar — overlay on mobile, in-grid on desktop */}
          <aside className={`
            ${sidebarOpen
              ? 'fixed inset-y-0 left-0 w-[300px] z-40 lg:relative lg:w-auto lg:z-auto overflow-y-auto lg:overflow-visible'
              : 'hidden lg:block overflow-visible relative z-10'
            }
          `}>
            <div className={`bg-brand-sidebar rounded-none lg:rounded-xl lg:sticky lg:top-6 overflow-visible ${sidebarOpen ? 'p-4 min-h-full lg:min-h-0' : 'p-2 lg:py-3 lg:px-2'}`}>

              {/* Desktop toggle button - chevron collapse/expand */}
              <div className={`hidden lg:flex ${sidebarOpen ? 'justify-end' : 'justify-center'} mb-3`}>
                <button
                  onClick={handleSidebarToggle}
                  className="p-1.5 rounded-lg text-[#8A9A7C] hover:text-white hover:bg-[#1E2712] transition-colors"
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

              {/* Mobile close button - shown when sidebar is expanded on mobile */}
              {sidebarOpen && (
                <div className="flex lg:hidden justify-end mb-2">
                  <button
                    onClick={handleSidebarToggle}
                    className="p-1.5 rounded-lg text-[#8A9A7C] hover:text-white hover:bg-[#1E2712] transition-colors"
                    title="Collapse sidebar"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}

              {/* Expanded content - hidden on all viewports when sidebar is closed */}
              <div className={`space-y-4 ${!sidebarOpen ? 'hidden' : ''}`}>
                {/* Logo */}
                <div className="px-1">
                  <img src="/logo-white.svg" alt="LexLens" className="h-10" />
                </div>
                <SearchBar onSearch={handleSearch} initialQuery={searchQuery} dark />
                <FilterBar
                  categories={categories}
                  jurisdictions={jurisdictions}
                  selectedFeedType={feedType}
                  selectedCategories={selectedCategories}
                  selectedJurisdictions={selectedJurisdictions}
                  selectedCourts={selectedCourts}
                  selectedDocTypes={selectedDocTypes}
                  selectedInstruments={selectedInstruments}
                  onFeedTypeChange={handleFeedTypeChange}
                  onCategoriesChange={setSelectedCategories}
                  onJurisdictionsChange={setSelectedJurisdictions}
                  onCourtsChange={setSelectedCourts}
                  onDocTypesChange={setSelectedDocTypes}
                  onInstrumentsChange={setSelectedInstruments}
                  dateFilter={dateFilter}
                  onDateFilterChange={setDateFilter}
                  dark
                />

                {/* Saved articles */}
                <button
                  onClick={() => setShowSaved(!showSaved)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    showSaved
                      ? 'bg-brand-accent text-white'
                      : 'text-[#9AAA8C] hover:text-white hover:bg-[#1E2712]'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={showSaved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={showSaved ? 0 : 1.5} className="w-4 h-4 flex-shrink-0">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
                  </svg>
                  Saved for Later
                </button>

                {/* Email Digest */}
                <button
                  onClick={() => setShowDigestSettings(true)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-[#9AAA8C] hover:text-white hover:bg-[#1E2712] transition-colors cursor-pointer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 flex-shrink-0">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                  </svg>
                  Email Digest
                </button>

                {/* User info */}
                <div className="border-t border-[#3A4A2C] pt-3 mt-2">
                  <div className="flex items-center gap-2.5 px-1">
                    <button
                      onClick={() => setShowAccountSettings(true)}
                      className="w-7 h-7 rounded-full bg-brand-accent/20 text-brand-accent flex items-center justify-center text-xs font-bold flex-shrink-0 hover:bg-brand-accent/30 transition-colors cursor-pointer"
                      title="Account Settings"
                    >
                      {(user.display_name || user.email)[0].toUpperCase()}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-medium truncate">{user.display_name || user.email}</p>
                    </div>
                    <button
                      onClick={logout}
                      className="p-1.5 rounded-lg text-[#6A7A5C] hover:text-white hover:bg-[#1E2712] transition-colors cursor-pointer"
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
                  {/* Search */}
                  <div className="relative group">
                    <button
                      onClick={handleSidebarToggle}
                      className="p-2 rounded-lg text-[#8A9A7C] hover:text-white hover:bg-[#1E2712] transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                      </svg>
                    </button>
                    <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-brand-accent text-white text-xs font-medium rounded-md whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-lg z-50">Search</span>
                  </div>

                  <div className="w-6 border-t border-[#3A4A2C] my-1" />

                  {/* Feed type icons */}
                  {([
                    { value: 'all' as FeedType, label: 'All', path: 'M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z' },
                    { value: 'news' as FeedType, label: 'News', path: 'M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5M6 7.5h3v3H6v-3Z' },
                    { value: 'blogpost' as FeedType, label: 'Blogposts', path: 'M16.862 4.487l1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10' },
                    { value: 'judgment' as FeedType, label: 'Case Law', path: 'M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0 0 12 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 0 1-2.031.352 5.988 5.988 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971Zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 0 1-2.031.352 5.989 5.989 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971Z' },
                    { value: 'regulatory' as FeedType, label: 'Regulatory', path: 'M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z' },
                    { value: 'legislation' as FeedType, label: 'Legislation', path: 'M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z' },
                    { value: 'procurement' as FeedType, label: 'Procurement', path: 'M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21m-3.75 3H21' },
                    { value: 'competition' as FeedType, label: 'Competition', path: '', filled: true },
                  ] as { value: FeedType; label: string; path: string; filled?: boolean }[]).map((ft) => (
                    <div key={ft.value} className="relative group">
                      <button
                        onClick={() => handleFeedTypeChange(ft.value)}
                        className={`p-2 rounded-lg transition-colors ${
                          feedType === ft.value
                            ? 'bg-brand-accent text-white'
                            : 'text-[#8A9A7C] hover:text-white hover:bg-[#1E2712]'
                        }`}
                      >
                        {ft.filled ? (
                          <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 441.5 441.5" className="w-5 h-5">
                            <path d="M429.477,436l-50.285-124.339c10.461-7.223,17.333-19.288,17.333-32.934c0-20.556-15.588-37.533-35.563-39.748l6.634-60.254c22.024-0.038,39.93-17.966,39.93-39.998c0-22.056-17.944-40-40-40c-11.361,0-21.623,4.77-28.912,12.401L257.26,56.266c2.223-4.974,3.47-10.476,3.47-16.266c0-22.056-17.944-40-40-40c-22.056,0-40,17.944-40,40c0,5.798,1.25,11.307,3.479,16.285l-81.324,54.844c-7.289-7.632-17.55-12.401-28.912-12.401c-22.056,0-40,17.944-40,40c0,22.032,17.906,39.96,39.93,39.998l6.634,60.254c-19.975,2.215-35.563,19.192-35.563,39.748c0,13.645,6.873,25.711,17.333,32.934L12.023,436c-0.499,1.233-0.352,2.634,0.392,3.736c0.743,1.103,1.986,1.764,3.316,1.764h44c1.844,0,3.449-1.26,3.886-3.052L93.042,317.91c8.931-1.837,16.779-6.664,22.463-13.38l72.23,56.169c-4.483,6.548-7.004,14.395-7.004,22.601c0,10.048,3.672,19.497,10.379,26.873l-3.666,26.785c-0.157,1.145,0.189,2.301,0.949,3.172c0.76,0.87,1.859,1.37,3.014,1.37h58.648c1.155,0,2.254-0.5,3.014-1.37c0.76-0.871,1.105-2.027,0.949-3.172l-3.666-26.785c6.707-7.377,10.379-16.826,10.379-26.873c0-8.197-2.516-16.037-6.99-22.581l72.255-56.188c5.684,6.716,13.532,11.543,22.463,13.38l29.425,120.538c0.437,1.792,2.042,3.052,3.886,3.052h44c1.33,0,2.573-0.661,3.316-1.764C429.829,438.634,429.976,437.233,429.477,436z M322.151,258.304l-64.316-31.386c1.128-2.815,1.931-5.757,2.399-8.757l0.96-0.685l61.536,39.895C322.534,257.68,322.339,257.989,322.151,258.304z M220.731,277.647c-17.645,0-32-14.356-32-32c0-17.645,14.355-32,32-32c17.645,0,32,14.355,32,32C252.731,263.291,238.376,277.647,220.731,277.647z M88.577,238.897l-6.711-60.955c9.307-1.871,17.452-6.982,23.212-14.103l68.224,48.643l-59.49,38.568C107.31,244.278,98.458,239.784,88.577,238.897z M180.924,208.092l-71.459-50.949c0.41-0.788,0.797-1.59,1.155-2.407l75.583,37.105C183.355,196.702,181.497,202.21,180.924,208.092z M118.77,257.371l61.536-39.895l0.905,0.646c0.468,3.02,1.272,5.984,2.409,8.818l-64.271,31.363C119.161,257.989,118.966,257.68,118.77,257.371z M188.731,212c0-17.645,14.355-32,32-32c17.645,0,32,14.355,32,32c0,2.842-0.373,5.609-1.09,8.288c-1.779-2.165-3.786-4.134-5.975-5.885c0.237-0.511,0.379-1.075,0.379-1.676c0-6.569-2.556-12.747-7.198-17.395c-1.561-1.563-4.093-1.565-5.657-0.005c-1.563,1.562-1.565,4.094-0.004,5.657c2.346,2.35,3.901,5.277,4.536,8.461c-5.161-2.432-10.918-3.799-16.991-3.799c-12.438,0-23.568,5.708-30.91,14.642C189.104,217.609,188.731,214.841,188.731,212z M332.035,157.143l-71.495,50.976c-0.581-6-2.494-11.613-5.437-16.547l75.77-36.851C331.233,155.543,331.622,156.35,332.035,157.143z M327.687,251.052l-59.49-38.569l68.224-48.643c5.76,7.12,13.905,12.232,23.212,14.103l-6.711,60.955C343.042,239.784,334.19,244.278,327.687,251.052z M367.526,106.728c17.645,0,32,14.355,32,32c0,17.645-14.355,32-32,32c-17.645,0-32-14.355-32-32C335.526,121.083,349.881,106.728,367.526,106.728z M333.679,117.45c-3.891,6.168-6.153,13.461-6.153,21.277c0,2.847,0.304,5.622,0.872,8.302l-78.149,38.008c-6.473-7.08-15.451-11.832-25.518-12.837V79.8c11.748-1.172,22.007-7.453,28.538-16.577L333.679,117.45z M220.731,8c17.645,0,32,14.355,32,32c0,17.645-14.355,32-32,32c-17.645,0-32-14.355-32-32C188.731,22.355,203.086,8,220.731,8z M188.206,63.24c6.531,9.114,16.785,15.388,28.525,16.56v92.4c-10.181,1.016-19.247,5.866-25.736,13.08L113.1,147.04c0.569-2.683,0.875-5.462,0.875-8.313c0-7.816-2.262-15.11-6.153-21.277L188.206,63.24z M41.974,138.727c0-17.644,14.355-32,32-32s32,14.355,32,32c0,17.645-14.355,32-32,32S41.974,156.372,41.974,138.727z M56.59,433.5H21.663l47.699-117.946c4.693,1.997,9.844,3.116,15.247,3.164L56.59,433.5z M84.974,310.728c-17.645,0-32-14.355-32-32c0-17.645,14.355-32,32-32s32,14.356,32,32C116.974,296.372,102.619,310.728,84.974,310.728z M122.735,265.553l59.003-28.792c-0.652,2.86-1.007,5.831-1.007,8.886c0,17.762,11.641,32.849,27.691,38.054l-9.001,65.76c-2.368,1.492-4.552,3.208-6.523,5.12l-72.846-56.648c3.136-5.704,4.924-12.249,4.924-19.205C124.974,274.112,124.179,269.682,122.735,265.553z M188.731,383.3c0-6.397,1.923-12.517,5.34-17.674l2.835,2.205l-4.228,30.89C190.102,394.053,188.731,388.787,188.731,383.3z M195.991,433.5l20.273-148.109c1.467,0.164,2.956,0.256,4.466,0.256c1.511,0,3-0.092,4.467-0.256L245.47,433.5H195.991z M252.731,383.3c0,5.488-1.371,10.753-3.947,15.421l-4.224-30.863l2.844-2.211C250.812,370.799,252.731,376.91,252.731,383.3z M248.582,354.596c-1.975-1.919-4.166-3.639-6.541-5.136l-9.001-65.76c16.05-5.205,27.69-20.292,27.69-38.054c0-3.063-0.357-6.04-1.012-8.907l59.047,28.814c-1.445,4.129-2.24,8.56-2.24,13.175c0,6.956,1.788,13.5,4.924,19.204L248.582,354.596z M324.526,278.728c0-17.645,14.355-32,32-32c17.645,0,32,14.356,32,32c0,17.645-14.355,32-32,32C338.881,310.728,324.526,296.372,324.526,278.728z M384.91,433.5l-28.02-114.782c5.402-0.048,10.554-1.167,15.247-3.164L419.837,433.5H384.91z"/>
                            <circle cx="84.731" cy="258.5" r="5.25"/><circle cx="74.081" cy="120" r="5.25"/><circle cx="368.833" cy="120" r="5.25"/><circle cx="357.74" cy="258.59" r="5.25"/><circle cx="221.182" cy="20.456" r="5.25"/><circle cx="221.182" cy="225.98" r="5.25"/><circle cx="221.182" cy="192.5" r="5.25"/>
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d={ft.path} />
                          </svg>
                        )}
                      </button>
                      <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-brand-accent text-white text-xs font-medium rounded-md whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-lg z-50">{ft.label}</span>
                    </div>
                  ))}

                  <div className="w-6 border-t border-[#3A4A2C] my-1" />

                  {/* Jurisdiction */}
                  <div className="relative group">
                    <button
                      onClick={handleSidebarToggle}
                      className={`p-2 rounded-lg transition-colors relative ${
                        selectedJurisdictions.length > 0 ? 'text-brand-accent' : 'text-[#8A9A7C] hover:text-white hover:bg-[#1E2712]'
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
                        selectedCategories.length > 0 ? 'text-brand-accent' : 'text-[#8A9A7C] hover:text-white hover:bg-[#1E2712]'
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
                        showSaved ? 'bg-brand-accent text-white' : 'text-[#8A9A7C] hover:text-white hover:bg-[#1E2712]'
                      }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={showSaved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={showSaved ? 0 : 1.5} className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
                      </svg>
                    </button>
                    <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-brand-accent text-white text-xs font-medium rounded-md whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-lg z-50">Saved</span>
                  </div>

                  {/* Email Digest */}
                  <div className="relative group">
                    <button
                      onClick={() => setShowDigestSettings(true)}
                      className="p-2 rounded-lg transition-colors text-[#8A9A7C] hover:text-white hover:bg-[#1E2712]"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                      </svg>
                    </button>
                    <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-brand-accent text-white text-xs font-medium rounded-md whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-lg z-50">Email Digest</span>
                  </div>

                  {/* Spacer + user avatar + academy link */}
                  <div className="flex-1" />
                  <div className="w-6 border-t border-[#3A4A2C] my-1" />
                  {/* Account Settings */}
                  <div className="relative group">
                    <button
                      onClick={() => setShowAccountSettings(true)}
                      className="p-2 rounded-lg text-[#8A9A7C] hover:text-white hover:bg-[#1E2712] transition-colors cursor-pointer"
                    >
                      <div className="w-5 h-5 rounded-full bg-brand-accent/20 text-brand-accent flex items-center justify-center text-[10px] font-bold">
                        {(user?.display_name || user?.email || '?')[0].toUpperCase()}
                      </div>
                    </button>
                    <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-brand-accent text-white text-xs font-medium rounded-md whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-lg z-50">Account Settings</span>
                  </div>

                  {/* Sign out */}
                  <div className="relative group">
                    <button
                      onClick={logout}
                      className="p-2 rounded-lg text-[#8A9A7C] hover:text-white hover:bg-[#1E2712] transition-colors cursor-pointer"
                      title="Sign out"
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
            {/* Mobile feed type tabs */}
            <div className="flex gap-1.5 pb-3 lg:hidden">
              {([
                { value: 'news' as FeedType, label: 'News' },
                { value: 'regulatory' as FeedType, label: 'Regulatory' },
                { value: 'judgment' as FeedType, label: 'Case Law' },
                { value: 'competition' as FeedType, label: 'Competition' },
              ]).map(ft => (
                <button
                  key={ft.value}
                  onClick={() => handleFeedTypeChange(ft.value)}
                  className={`px-3 py-2 text-xs font-medium rounded-full whitespace-nowrap transition-all ${
                    feedType === ft.value
                      ? 'bg-brand-body text-white shadow-sm'
                      : 'bg-white text-brand-muted border border-brand-border'
                  }`}
                >
                  {ft.label}
                </button>
              ))}
            </div>

            {/* View toggle + Active filters summary */}
            <div className="flex items-center justify-between pb-3">
              {/* All pill on mobile, next to view switcher */}
              <button
                onClick={() => handleFeedTypeChange('all')}
                className={`px-3 py-2 text-xs font-medium rounded-full whitespace-nowrap transition-all mr-2 lg:hidden ${
                  feedType === 'all'
                    ? 'bg-brand-body text-white shadow-sm'
                    : 'bg-white text-brand-muted border border-brand-border'
                }`}
              >
                All
              </button>
              <div className="flex items-center gap-2 text-sm text-brand-muted flex-wrap flex-1 min-w-0">
            {(feedType !== 'all' || selectedCategories.length > 0 || selectedJurisdictions.length > 0 || selectedCourts.length > 0 || selectedDocTypes.length > 0 || selectedInstruments.length > 0 || searchQuery || showSaved || dateFilter.preset !== 'all') && (
              <>
                <span>Showing:</span>
                {showSaved && <span className="px-2 py-0.5 bg-brand-accent/10 text-brand-accent rounded text-xs font-medium">Saved only</span>}
                {dateFilter.preset !== 'all' && (
                  <button
                    onClick={() => setDateFilter({ preset: 'all' })}
                    className="px-2 py-0.5 bg-brand-accent/10 text-brand-accent rounded text-xs font-medium hover:bg-brand-accent hover:text-white transition-colors flex items-center gap-1"
                  >
                    {dateFilter.preset === 'today' ? 'Today' :
                     dateFilter.preset === '7d' ? '7 Days' :
                     dateFilter.preset === '30d' ? '30 Days' :
                     `${dateFilter.from || '...'} — ${dateFilter.to || '...'}`}
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
                {feedType !== 'all' && <span className="px-2 py-0.5 bg-brand-body/10 text-brand-body rounded text-xs font-medium">{{ news: 'News', blogpost: 'Blogposts', judgment: 'Case Law', competition: 'Competition', regulatory: 'Regulatory', legislation: 'Legislation', procurement: 'Procurement' }[feedType] || feedType}</span>}
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
                {selectedCourts.length > 0 && <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-xs font-medium">{selectedCourts.map(c => {
                  const ptMap: Record<string, string> = {
                    'Supremo Tribunal de Justiça': 'STJ',
                    'Supremo Tribunal Administrativo': 'STA',
                    'Tribunal da Relação de Lisboa': 'TRL',
                    'Tribunal da Relação do Porto': 'TRP',
                    'Tribunal da Relação de Coimbra': 'TRC',
                    'Tribunal da Relação de Évora': 'TRE',
                    'Tribunal da Relação de Guimarães': 'TRG',
                    'Tribunal Central Administrativo Sul': 'TCA-S',
                    'Tribunal Central Administrativo Norte': 'TCA-N',
                  };
                  return ptMap[c] || c;
                }).join(', ')}</span>}
                {selectedDocTypes.length > 0 && <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-xs font-medium">{selectedDocTypes.map(d => d === 'Opinion of Advocate General' ? 'AG Opinion' : d).join(', ')}</span>}
                {selectedInstruments.length > 0 && <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded text-xs font-medium">{selectedInstruments.map(i => i === 'antitrust' ? 'Antitrust' : i === 'merger' ? 'Merger' : i === 'dma' ? 'DMA' : i === 'fsr' ? 'FSR' : i).join(', ')}</span>}
                {searchQuery && <span className="px-2 py-0.5 bg-brand-body/10 text-brand-body rounded text-xs font-medium">&ldquo;{searchQuery}&rdquo;</span>}
                <button
                  onClick={() => {
                    setFeedType('all');
                    setSelectedCategories([]);
                    setSelectedJurisdictions([]);
                    setSelectedCourts([]);
                    setSelectedDocTypes([]);
                    setSelectedInstruments([]);
                    setSearchQuery('');
                    setShowSaved(false);
                    setDateFilter({ preset: 'all' });
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
                  onClick={() => { setViewMode('card'); try { localStorage.setItem('lexnews-view-mode', 'card'); } catch {} }}
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${viewMode === 'card' ? 'bg-brand-body text-white' : 'text-brand-muted hover:text-brand-body hover:bg-brand-bg-hover'}`}
                  title="Card view"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z" />
                  </svg>
                </button>
                <button
                  onClick={() => { setViewMode('list'); try { localStorage.setItem('lexnews-view-mode', 'list'); } catch {} }}
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
                    <ArticleCard key={a.id} article={a} view="card" onSelect={handleSelectArticle} isSelected={selectedArticle?.id === a.id} onReadChange={handleReadChange} onImportantChange={handleImportantChange} onSaveChange={handleSaveChange} onCategoryClick={handleCategoryClick} />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {articles.map((a) => (
                    <ArticleCard key={a.id} article={a} view="list" onSelect={handleSelectArticle} isSelected={selectedArticle?.id === a.id} onReadChange={handleReadChange} onImportantChange={handleImportantChange} onSaveChange={handleSaveChange} onCategoryClick={handleCategoryClick} />
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
                  className="px-4 py-2.5 sm:px-3 sm:py-1.5 text-sm border border-brand-border rounded-lg hover:bg-brand-bg-hover disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-brand-muted">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page >= totalPages}
                  className="px-4 py-2.5 sm:px-3 sm:py-1.5 text-sm border border-brand-border rounded-lg hover:bg-brand-bg-hover disabled:opacity-30 disabled:cursor-not-allowed"
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
              onImportantChange={handleImportantChange}
              onSaveChange={handleSaveChange}
            />
          )}
        </div>
      </main>

      {/* Account Settings Modal */}
      {showAccountSettings && (
        <AccountSettingsModal
          user={user}
          onClose={() => setShowAccountSettings(false)}
          onUserUpdate={(updatedUser) => setUser(updatedUser)}
        />
      )}

      {/* Digest Settings Modal */}
      {showDigestSettings && (
        <DigestSettings onClose={() => setShowDigestSettings(false)} />
      )}
    </div>
  );
}

// ─── Account Settings Modal ─────────────────────────────────────

function AccountSettingsModal({ user, onClose, onUserUpdate }: {
  user: { email: string; display_name?: string | null; auth_provider?: string; category_slugs?: string[]; jurisdiction?: string | null };
  onClose: () => void;
  onUserUpdate: (user: ReturnType<typeof Object>) => void;
}) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMessage, setPwMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCats, setSelectedCats] = useState<string[]>(user.category_slugs || []);
  const [selectedJur, setSelectedJur] = useState<string>(user.jurisdiction || '');
  const [prefSaving, setPrefSaving] = useState(false);
  const [prefMessage, setPrefMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    fetchCategories()
      .then((catData) => {
        setCategories(catData.categories || []);
      })
      .catch(() => setPrefMessage({ type: 'error', text: 'Failed to load data.' }))
      .finally(() => setDataLoading(false));
  }, []);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPwMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }
    if (newPassword.length < 8) {
      setPwMessage({ type: 'error', text: 'Password must be at least 8 characters.' });
      return;
    }
    setPwSaving(true);
    setPwMessage(null);
    try {
      await changePassword(currentPassword, newPassword);
      setPwMessage({ type: 'success', text: 'Password updated successfully.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPwMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to change password.' });
    } finally {
      setPwSaving(false);
    }
  }

  async function handleSavePreferences() {
    if (selectedCats.length === 0) {
      setPrefMessage({ type: 'error', text: 'Please select at least one area of law.' });
      return;
    }
    if (!selectedJur) {
      setPrefMessage({ type: 'error', text: 'Please select a jurisdiction.' });
      return;
    }
    setPrefSaving(true);
    setPrefMessage(null);
    try {
      const data = await updatePreferences(selectedCats, selectedJur);
      if (data.user) onUserUpdate(data.user);
      setPrefMessage({ type: 'success', text: 'Preferences saved.' });
    } catch (err) {
      setPrefMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to save.' });
    } finally {
      setPrefSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-brand-border px-6 py-4 rounded-t-2xl flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold text-brand-heading">Account Settings</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-brand-muted hover:text-brand-body hover:bg-brand-bg transition-colors cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Change Password — only for standalone users */}
          {user.auth_provider === 'standalone' && (
            <form onSubmit={handleChangePassword} className="space-y-3">
              <h3 className="font-heading text-sm font-bold text-brand-heading">Change Password</h3>
              <input
                type="password"
                placeholder="Current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-brand-border rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-accent/30 focus:border-brand-accent/50"
                required
              />
              <input
                type="password"
                placeholder="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-brand-border rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-accent/30 focus:border-brand-accent/50"
                required
              />
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-brand-border rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-accent/30 focus:border-brand-accent/50"
                required
              />
              {pwMessage && (
                <p className={`text-xs ${pwMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{pwMessage.text}</p>
              )}
              <button
                type="submit"
                disabled={pwSaving}
                className="px-4 py-2 text-sm font-semibold bg-brand-accent text-white rounded-lg hover:bg-brand-accent/90 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {pwSaving ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          )}

          {/* Default Areas of Law */}
          <div className="space-y-2">
            <h3 className="font-heading text-sm font-bold text-brand-heading">Default Areas of Law</h3>
            {dataLoading ? (
              <div className="flex justify-center py-4">
                <div className="w-5 h-5 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <MultiSelectDropdown
                label="Select areas"
                options={categories.map(cat => ({ value: cat.slug, label: cat.name }))}
                selected={selectedCats}
                onChange={setSelectedCats}
                searchable
              />
            )}
          </div>

          {/* Default Jurisdiction */}
          <div className="space-y-2">
            <h3 className="font-heading text-sm font-bold text-brand-heading">Default Jurisdiction</h3>
            {dataLoading ? (
              <div className="flex justify-center py-4">
                <div className="w-5 h-5 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <select
                value={selectedJur}
                onChange={(e) => setSelectedJur(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-brand-border rounded-lg bg-white text-brand-body focus:outline-none focus:ring-1 focus:ring-brand-accent/30 focus:border-brand-accent/50 cursor-pointer"
              >
                <option value="">Select jurisdiction...</option>
                {SETTINGS_JURISDICTIONS.map(j => (
                  <option key={j} value={j}>{j}</option>
                ))}
              </select>
            )}
          </div>

          {/* Save preferences */}
          {prefMessage && (
            <p className={`text-xs ${prefMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{prefMessage.text}</p>
          )}
          <button
            onClick={handleSavePreferences}
            disabled={prefSaving || dataLoading}
            className="w-full px-4 py-2.5 text-sm font-semibold bg-brand-accent text-white rounded-lg hover:bg-brand-accent/90 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {prefSaving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </div>
  );
}
