'use client';

import { useState } from 'react';
import type { CustomLens } from '@/lib/api';

interface LensBarProps {
  lenses: CustomLens[];
  activeLensId: number | null;
  onActivateLens: (lens: CustomLens) => void;
  onDeactivateLens: () => void;
  onCreateLens: (name: string, keywords: string) => Promise<void>;
  onDeleteLens: (id: number) => Promise<void>;
  children?: React.ReactNode;
}

export default function LensBar({
  lenses,
  activeLensId,
  onActivateLens,
  onDeactivateLens,
  onCreateLens,
  onDeleteLens,
  children,
}: LensBarProps) {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2 overflow-x-auto pt-3 pb-2 pr-1 scrollbar-thin">
        {children}
        {lenses.map(lens => (
          <LensChip
            key={lens.id}
            lens={lens}
            isActive={activeLensId === lens.id}
            onToggle={() =>
              activeLensId === lens.id ? onDeactivateLens() : onActivateLens(lens)
            }
            onDelete={() => onDeleteLens(lens.id)}
          />
        ))}

        {lenses.length < 20 && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-brand-muted border border-dashed border-brand-border rounded-full hover:border-brand-accent hover:text-brand-accent transition-colors whitespace-nowrap shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Create your Lens
          </button>
        )}
      </div>

      {showCreate && (
        <CreateLensModal
          onClose={() => setShowCreate(false)}
          onCreate={async (name, keywords) => {
            await onCreateLens(name, keywords);
            setShowCreate(false);
          }}
        />
      )}
    </>
  );
}

// ─── Lens Chip ──────────────────────────────────────────────────────

function LensChip({
  lens,
  isActive,
  onToggle,
  onDelete,
}: {
  lens: CustomLens;
  isActive: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="group relative shrink-0">
      <button
        onClick={onToggle}
        className={`flex items-center gap-0.5 px-3 py-1.5 text-sm font-medium rounded-full transition-all whitespace-nowrap ${
          isActive
            ? 'bg-brand-accent text-white shadow-sm'
            : 'bg-white border border-brand-border text-brand-body hover:bg-brand-bg'
        }`}
      >
        <span className={isActive ? 'text-white/70' : 'text-brand-accent'}>#</span>
        {lens.name}
      </button>

      {/* Delete button — shows on hover, confirms via native dialog */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (window.confirm(`Delete lens #${lens.name}?`)) {
            onDelete();
          }
        }}
        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-sm"
        title="Delete lens"
      >
        ×
      </button>
    </div>
  );
}

// ─── Create Modal ───────────────────────────────────────────────────

function CreateLensModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (name: string, keywords: string) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [keywords, setKeywords] = useState('');
  const [keywordsManual, setKeywordsManual] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function handleNameChange(val: string) {
    setName(val);
    // Auto-fill keywords if user hasn't manually edited them
    if (!keywordsManual) {
      setKeywords(val);
    }
  }

  function handleKeywordsChange(val: string) {
    setKeywords(val);
    setKeywordsManual(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !keywords.trim()) return;

    setSaving(true);
    setError('');
    try {
      await onCreate(name.trim(), keywords.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create lens');
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl border border-brand-border p-6 w-full max-w-sm mx-4">
        <h2 className="font-heading text-base font-semibold text-brand-heading mb-4">Create Custom Lens</h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-brand-muted mb-1">Name</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-accent font-semibold text-base">#</span>
              <input
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Vodafone"
                maxLength={50}
                autoFocus
                className="w-full pl-7 pr-3 py-2 border border-brand-border rounded-lg text-base text-brand-body placeholder:text-brand-muted/50 focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-brand-muted mb-1">Search Keywords</label>
            <input
              type="text"
              value={keywords}
              onChange={(e) => handleKeywordsChange(e.target.value)}
              placeholder="e.g. Vodafone VDF Ziggo"
              maxLength={200}
              className="w-full px-3 py-2 border border-brand-border rounded-lg text-base text-brand-body placeholder:text-brand-muted/50 focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent/30"
            />
            <p className="text-[10px] text-brand-muted mt-1">Searches article titles and descriptions</p>
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 px-3 py-1.5 rounded">{error}</p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={!name.trim() || !keywords.trim() || saving}
              className="flex-1 px-4 py-2 bg-brand-accent text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Creating...' : 'Create Lens'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-brand-bg text-brand-muted rounded-lg text-sm font-medium hover:bg-brand-border transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
