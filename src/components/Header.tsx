'use client';

interface HeaderProps {
  showSaved: boolean;
  onToggleSaved: () => void;
  onRefresh: () => void;
  refreshing: boolean;
}

export default function Header({ showSaved, onToggleSaved, onRefresh, refreshing }: HeaderProps) {
  return (
    <header className="border-b border-brand-border bg-white/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="font-heading text-xl font-bold tracking-tight">
            Legal News
          </h1>
          <span className="text-xs text-brand-muted font-body mt-0.5">
            Aggregator
          </span>
        </div>

        <div className="flex items-center gap-2">
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
