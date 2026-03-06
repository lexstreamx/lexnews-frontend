'use client';

import { useState, useRef, useEffect } from 'react';

interface MultiSelectDropdownProps {
  label: string;
  options: { value: string; label: string; count?: number }[];
  selected: string[];
  onChange: (selected: string[]) => void;
  searchable?: boolean;
  dark?: boolean;
}

export default function MultiSelectDropdown({
  label,
  options,
  selected,
  onChange,
  searchable = false,
  dark = false,
}: MultiSelectDropdownProps) {
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
                className="flex items-center gap-2 px-3 py-2.5 text-xs hover:bg-brand-bg-hover cursor-pointer"
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
