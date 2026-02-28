'use client';

import { ViewMode } from '@/types';

interface HeaderProps {
  showSaved: boolean;
  onToggleSaved: () => void;
  onRefresh: () => void;
  refreshing: boolean;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export default function Header({ showSaved, onToggleSaved, onRefresh, refreshing, viewMode, onViewModeChange }: HeaderProps) {
  return (
    <header className="border-b border-brand-border bg-white/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="font-heading text-xl font-bold tracking-tight">
            Legal News
          </h1>
          <span className="text-xs text-brand-muted font-body mt-0.5">
            Aggregator
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center border border-brand-border rounded-lg overflow-hidden">
            <button
              onClick={() => onViewModeChange('card')}
              className={`p-1.5 transition-colors ${
                viewMode === 'card'
                  ? 'bg-brand-body text-white'
                  : 'text-brand-muted hover:text-brand-body hover:bg-brand-bg-hover'
              }`}
              title="Card view"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z" />
              </svg>
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={`p-1.5 transition-colors ${
                viewMode === 'list'
                  ? 'bg-brand-body text-white'
                  : 'text-brand-muted hover:text-brand-body hover:bg-brand-bg-hover'
              }`}
              title="List view"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 5.25h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5" />
              </svg>
            </button>
          </div>

          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-brand-muted hover:text-brand-body border border-brand-border rounded-lg hover:bg-brand-bg-hover transition-all disabled:opacity-50"
            title="Refresh feeds"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182"
              />
            </svg>
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>

          <button
            onClick={onToggleSaved}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
              showSaved
                ? 'bg-brand-accent text-white'
                : 'text-brand-muted hover:text-brand-body border border-brand-border hover:bg-brand-bg-hover'
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill={showSaved ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth={showSaved ? 0 : 1.5}
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z"
              />
            </svg>
            Saved
          </button>
        </div>
      </div>
    </header>
  );
}
