'use client';

import { Category, FeedType } from '@/types';

const FEED_TYPES: { value: FeedType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'news', label: 'News' },
  { value: 'blogpost', label: 'Blogposts' },
  { value: 'judgment', label: 'Judgments' },
  { value: 'regulatory', label: 'Regulatory' },
];

interface FilterBarProps {
  categories: Category[];
  selectedFeedType: FeedType;
  selectedCategory: string | null;
  selectedJurisdiction: string;
  onFeedTypeChange: (type: FeedType) => void;
  onCategoryChange: (slug: string | null) => void;
  onJurisdictionChange: (jurisdiction: string) => void;
}

export default function FilterBar({
  categories,
  selectedFeedType,
  selectedCategory,
  selectedJurisdiction,
  onFeedTypeChange,
  onCategoryChange,
  onJurisdictionChange,
}: FilterBarProps) {
  return (
    <div className="space-y-4">
      {/* Feed type tabs */}
      <div className="flex gap-1 p-1 bg-brand-bg rounded-lg">
        {FEED_TYPES.map((ft) => (
          <button
            key={ft.value}
            onClick={() => onFeedTypeChange(ft.value)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
              selectedFeedType === ft.value
                ? 'bg-brand-body text-white shadow-sm'
                : 'text-brand-muted hover:text-brand-body'
            }`}
          >
            {ft.label}
          </button>
        ))}
      </div>

      {/* Jurisdiction filter */}
      <div>
        <input
          type="text"
          placeholder="Filter by jurisdiction..."
          value={selectedJurisdiction}
          onChange={(e) => onJurisdictionChange(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-brand-border rounded-lg bg-white text-brand-body placeholder-brand-muted/60 focus:outline-none focus:border-brand-accent/50 focus:ring-1 focus:ring-brand-accent/20"
        />
      </div>

      {/* Legal area categories */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-brand-muted mb-2">
          Areas of Law
        </h4>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => onCategoryChange(null)}
            className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all ${
              !selectedCategory
                ? 'bg-brand-accent text-white'
                : 'bg-white text-brand-muted border border-brand-border hover:border-brand-accent/30'
            }`}
          >
            All Areas
          </button>
          {categories.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => onCategoryChange(cat.slug === selectedCategory ? null : cat.slug)}
              className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all ${
                selectedCategory === cat.slug
                  ? 'bg-brand-accent text-white'
                  : 'bg-white text-brand-muted border border-brand-border hover:border-brand-accent/30'
              }`}
            >
              {cat.name}
              {cat.article_count && parseInt(String(cat.article_count)) > 0 && (
                <span className="ml-1 opacity-60">({cat.article_count})</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
