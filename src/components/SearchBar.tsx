'use client';

import { useState } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  initialQuery?: string;
  dark?: boolean;
}

export default function SearchBar({ onSearch, initialQuery = '', dark = false }: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSearch(query);
  }

  function handleClear() {
    setQuery('');
    onSearch('');
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${dark ? 'text-white/50' : 'text-brand-muted'}`}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
        />
      </svg>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search articles..."
        className={`w-full pl-9 pr-8 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-accent/20 focus:border-brand-accent/50 ${dark ? 'bg-white/10 border-white/20 text-white placeholder-white/40' : 'bg-white border-brand-border text-brand-body placeholder-brand-muted/60'}`}
      />
      {query && (
        <button
          type="button"
          onClick={handleClear}
          className={`absolute right-3 top-1/2 -translate-y-1/2 ${dark ? 'text-white/50 hover:text-white' : 'text-brand-muted hover:text-brand-body'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </form>
  );
}
