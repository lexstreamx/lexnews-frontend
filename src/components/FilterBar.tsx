'use client';

import { useState, useRef, useEffect } from 'react';
import { Category, FeedType, DatePreset, DateFilter } from '@/types';

const FEED_TYPES: { value: FeedType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'news', label: 'News' },
  { value: 'blogpost', label: 'Blogposts' },
  { value: 'judgment', label: 'Case Law' },
  { value: 'regulatory', label: 'Regulatory' },
  { value: 'legislation', label: 'Legislation' },
];

const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'today', label: 'Today' },
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: 'custom', label: 'Custom' },
];

// Reusable multi-select dropdown
function MultiSelectDropdown({
  label,
  options,
  selected,
  onChange,
  searchable = false,
  dark = false,
}: {
  label: string;
  options: { value: string; label: string; count?: number }[];
  selected: string[];
  onChange: (selected: string[]) => void;
  searchable?: boolean;
  dark?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const filtered = searchable && search
    ? options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  function toggle(value: string) {
    if (selected.includes(value)) {
      onChange(selected.filter(v => v !== value));
    } else {
      onChange([...selected, value]);
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between px-3 py-2 text-sm border rounded-lg transition-all ${
          selected.length > 0
            ? dark ? 'border-brand-accent/50 bg-brand-accent/15 text-white' : 'border-brand-accent/50 bg-brand-accent/5 text-brand-body'
            : dark ? 'border-[#3A4A2C] bg-[#1E2712] text-[#9AAA8C]' : 'border-brand-border bg-white text-brand-muted'
        }`}
      >
        <span className="truncate">
          {selected.length === 0
            ? label
            : `${label} (${selected.length})`}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className={`w-3.5 h-3.5 ml-2 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-40 mt-1 w-full bg-white border border-brand-border rounded-lg shadow-lg max-h-64 overflow-hidden flex flex-col">
          {/* Search input */}
          {searchable && (
            <div className="p-2 border-b border-brand-border">
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-brand-border rounded bg-brand-bg placeholder-brand-muted/60 focus:outline-none focus:border-brand-accent/50"
                autoFocus
              />
            </div>
          )}

          {/* Select all / Clear */}
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-brand-border text-xs">
            <button
              onClick={() => onChange(options.map(o => o.value))}
              className="text-brand-accent hover:underline"
            >
              Select all
            </button>
            <button
              onClick={() => { onChange([]); }}
              className="text-brand-muted hover:text-brand-body"
            >
              Clear
            </button>
          </div>

          {/* Options */}
          <div className="overflow-y-auto flex-1">
            {filtered.map((opt) => (
              <label
                key={opt.value}
                className="flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-brand-bg-hover cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(opt.value)}
                  onChange={() => toggle(opt.value)}
                  className="rounded border-brand-border text-brand-accent focus:ring-brand-accent/20 w-3.5 h-3.5"
                />
                <span className="flex-1 truncate text-brand-body">{opt.label}</span>
                {opt.count !== undefined && opt.count > 0 && (
                  <span className="text-brand-muted opacity-60">{opt.count}</span>
                )}
              </label>
            ))}
            {filtered.length === 0 && (
              <div className="px-3 py-2 text-xs text-brand-muted">No results</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const COURT_OPTIONS = [
  { value: 'Court of Justice', label: 'Court of Justice' },
  { value: 'General Court', label: 'General Court' },
];

const DOC_TYPE_OPTIONS = [
  { value: 'Judgment', label: 'Judgment' },
  { value: 'Opinion of Advocate General', label: 'AG Opinion' },
  { value: 'Press Release', label: 'Press Release' },
  { value: 'Order', label: 'Order' },
];

interface FilterBarProps {
  categories: Category[];
  jurisdictions: string[];
  selectedFeedType: FeedType;
  selectedCategories: string[];
  selectedJurisdictions: string[];
  selectedCourts: string[];
  selectedDocTypes: string[];
  onFeedTypeChange: (type: FeedType) => void;
  onCategoriesChange: (slugs: string[]) => void;
  onJurisdictionsChange: (jurisdictions: string[]) => void;
  onCourtsChange: (courts: string[]) => void;
  onDocTypesChange: (docTypes: string[]) => void;
  dateFilter: DateFilter;
  onDateFilterChange: (filter: DateFilter) => void;
  dark?: boolean;
}

export default function FilterBar({
  categories,
  jurisdictions,
  selectedFeedType,
  selectedCategories,
  selectedJurisdictions,
  selectedCourts,
  selectedDocTypes,
  onFeedTypeChange,
  onCategoriesChange,
  onJurisdictionsChange,
  onCourtsChange,
  onDocTypesChange,
  dateFilter,
  onDateFilterChange,
  dark = false,
}: FilterBarProps) {
  const categoryOptions = categories.map((cat) => ({
    value: cat.slug,
    label: cat.name,
  }));

  const jurisdictionOptions = jurisdictions.map((j) => ({
    value: j,
    label: j,
  }));

  return (
    <div className="space-y-3">
      {/* Feed type tabs */}
      <div className={`flex flex-wrap gap-1 p-1 rounded-lg ${dark ? 'bg-[#1E2712]' : 'bg-brand-bg'}`}>
        {FEED_TYPES.map((ft) => (
          <button
            key={ft.value}
            onClick={() => onFeedTypeChange(ft.value)}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-all ${
              selectedFeedType === ft.value
                ? dark ? 'bg-brand-accent text-white shadow-sm' : 'bg-brand-body text-white shadow-sm'
                : dark ? 'text-[#8A9A7C] hover:text-white' : 'text-brand-muted hover:text-brand-body'
            }`}
          >
            {ft.label}
          </button>
        ))}
      </div>

      {/* Date range filter */}
      <div className="space-y-2">
        <div className={`flex flex-wrap gap-1 p-1 rounded-lg ${dark ? 'bg-[#1E2712]' : 'bg-brand-bg'}`}>
          {DATE_PRESETS.map((dp) => (
            <button
              key={dp.value}
              onClick={() => onDateFilterChange(
                dp.value === 'custom'
                  ? { preset: 'custom', from: dateFilter.from || '', to: dateFilter.to || '' }
                  : { preset: dp.value }
              )}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                dateFilter.preset === dp.value
                  ? dark ? 'bg-brand-accent text-white shadow-sm' : 'bg-brand-body text-white shadow-sm'
                  : dark ? 'text-[#8A9A7C] hover:text-white' : 'text-brand-muted hover:text-brand-body'
              }`}
            >
              {dp.label}
            </button>
          ))}
        </div>
        {dateFilter.preset === 'custom' && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className={`text-xs shrink-0 ${dark ? 'text-[#7A8A6C]' : 'text-brand-muted'}`}>From</span>
              <input
                type="date"
                value={dateFilter.from || ''}
                onChange={(e) => onDateFilterChange({ ...dateFilter, from: e.target.value })}
                className={`w-full px-2.5 py-1.5 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-accent/20 focus:border-brand-accent/50 ${
                  dark
                    ? 'bg-[#1E2712] border-[#3A4A2C] text-white [color-scheme:dark]'
                    : 'bg-white border-brand-border text-brand-body'
                }`}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs shrink-0 ${dark ? 'text-[#7A8A6C]' : 'text-brand-muted'}`}>To</span>
              <input
                type="date"
                value={dateFilter.to || ''}
                onChange={(e) => onDateFilterChange({ ...dateFilter, to: e.target.value })}
                className={`w-full px-2.5 py-1.5 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-accent/20 focus:border-brand-accent/50 ${
                  dark
                    ? 'bg-[#1E2712] border-[#3A4A2C] text-white [color-scheme:dark]'
                    : 'bg-white border-brand-border text-brand-body'
                }`}
              />
            </div>
          </div>
        )}
      </div>

      {/* Jurisdiction multi-select */}
      <MultiSelectDropdown
        label="Jurisdiction"
        options={jurisdictionOptions}
        selected={selectedJurisdictions}
        onChange={onJurisdictionsChange}
        searchable={jurisdictions.length > 8}
        dark={dark}
      />

      {/* Caselaw-specific filters */}
      {selectedFeedType === 'judgment' && (
        <div className="space-y-2">
          <MultiSelectDropdown
            label="Court"
            options={COURT_OPTIONS}
            selected={selectedCourts}
            onChange={onCourtsChange}
            dark={dark}
          />
          <MultiSelectDropdown
            label="Document Type"
            options={DOC_TYPE_OPTIONS}
            selected={selectedDocTypes}
            onChange={onDocTypesChange}
            dark={dark}
          />
        </div>
      )}

      {/* Categories multi-select */}
      <MultiSelectDropdown
        label="Areas of Law"
        options={categoryOptions}
        selected={selectedCategories}
        onChange={onCategoriesChange}
        searchable
        dark={dark}
      />
    </div>
  );
}
