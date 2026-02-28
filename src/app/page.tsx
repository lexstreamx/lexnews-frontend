'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import SearchBar from '@/components/SearchBar';
import FilterBar from '@/components/FilterBar';
import ArticleCard from '@/components/ArticleCard';
import { fetchArticles, fetchCategories, refreshFeeds } from '@/lib/api';
import { Article, Category, FeedType, ViewMode } from '@/types';

export default function Home() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // View mode
  const [viewMode, setViewMode] = useState<ViewMode>('card');

  // Filters
  const [feedType, setFeedType] = useState<FeedType>('all');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [jurisdiction, setJurisdiction] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSaved, setShowSaved] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Load view mode from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('lexnews-view-mode');
    if (stored === 'card' || stored === 'list') {
      setViewMode(stored);
    }
  }, []);

  function handleViewModeChange(mode: ViewMode) {
    setViewMode(mode);
    localStorage.setItem('lexnews-view-mode', mode);
  }

  const loadArticles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchArticles({
        page,
        limit: 30,
        feed_type: feedType !== 'all' ? feedType : undefined,
        category: selectedCategory || undefined,
        jurisdiction: jurisdiction || undefined,
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
  }, [page, feedType, selectedCategory, jurisdiction, searchQuery, showSaved]);

  const loadCategories = useCallback(async () => {
    try {
      const data = await fetchCategories();
      setCategories(data.categories);
    } catch {
      // Categories will just be empty
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [feedType, selectedCategory, jurisdiction, searchQuery, showSaved]);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await refreshFeeds();
      await loadArticles();
    } catch {
      setError('Failed to refresh feeds.');
    } finally {
      setRefreshing(false);
    }
  }

  function handleSearch(query: string) {
    setSearchQuery(query);
  }

  return (
    <div className="min-h-screen">
      <Header
        showSaved={showSaved}
        onToggleSaved={() => setShowSaved(!showSaved)}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
      />

      <main className={`mx-auto px-4 py-6 ${viewMode === 'card' ? 'max-w-7xl' : 'max-w-5xl'}`}>
        <div className={`grid grid-cols-1 ${viewMode === 'card' ? 'lg:grid-cols-[280px_1fr]' : 'lg:grid-cols-[280px_1fr]'} gap-6`}>
          {/* Sidebar */}
          <aside className="space-y-4">
            <SearchBar onSearch={handleSearch} initialQuery={searchQuery} />
            <FilterBar
              categories={categories}
              selectedFeedType={feedType}
              selectedCategory={selectedCategory}
              selectedJurisdiction={jurisdiction}
              onFeedTypeChange={setFeedType}
              onCategoryChange={setSelectedCategory}
              onJurisdictionChange={setJurisdiction}
            />
          </aside>

          {/* Articles area */}
          <div>
            {/* Active filters summary */}
            {(feedType !== 'all' || selectedCategory || jurisdiction || searchQuery || showSaved) && (
              <div className="flex items-center gap-2 text-sm text-brand-muted pb-3">
                <span>Showing:</span>
                {showSaved && <span className="px-2 py-0.5 bg-brand-accent/10 text-brand-accent rounded text-xs font-medium">Saved only</span>}
                {feedType !== 'all' && <span className="px-2 py-0.5 bg-brand-body/10 text-brand-body rounded text-xs font-medium">{feedType}</span>}
                {selectedCategory && <span className="px-2 py-0.5 bg-brand-accent/10 text-brand-accent rounded text-xs font-medium">{selectedCategory}</span>}
                {jurisdiction && <span className="px-2 py-0.5 bg-brand-body/10 text-brand-body rounded text-xs font-medium">{jurisdiction}</span>}
                {searchQuery && <span className="px-2 py-0.5 bg-brand-body/10 text-brand-body rounded text-xs font-medium">&ldquo;{searchQuery}&rdquo;</span>}
                <button
                  onClick={() => {
                    setFeedType('all');
                    setSelectedCategory(null);
                    setJurisdiction('');
                    setSearchQuery('');
                    setShowSaved(false);
                  }}
                  className="text-xs text-brand-accent hover:underline ml-auto"
                >
                  Clear all
                </button>
              </div>
            )}

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
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {articles.map((article) => (
                    <ArticleCard key={article.id} article={article} view="card" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {articles.map((article) => (
                    <ArticleCard key={article.id} article={article} view="list" />
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
        </div>
      </main>
    </div>
  );
}
