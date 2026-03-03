'use client';

import { useState, useEffect, useCallback } from 'react';
import { DigestLog, Category } from '@/types';
import {
  fetchDigestPreferences,
  updateDigestPreferences,
  fetchCategories,
  fetchDigestHistory,
} from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

interface DigestSettingsProps {
  onClose: () => void;
}

export default function DigestSettings({ onClose }: DigestSettingsProps) {
  const { user } = useAuth();

  // Form state
  const [enabled, setEnabled] = useState(false);
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>('weekly');
  const [primaryCategory, setPrimaryCategory] = useState<string | null>(null);

  // Data
  const [categories, setCategories] = useState<Category[]>([]);
  const [history, setHistory] = useState<DigestLog[]>([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Load preferences and reference data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [prefsRes, catsRes, histRes] = await Promise.all([
        fetchDigestPreferences(),
        fetchCategories(),
        fetchDigestHistory().catch(() => ({ logs: [] })),
      ]);

      const prefs = prefsRes.preferences;
      setEnabled(prefs.enabled);
      setFrequency(prefs.frequency);

      // Resolve primary category
      if (prefs.primary_category_slug) {
        setPrimaryCategory(prefs.primary_category_slug);
      } else if (prefs.category_slugs && prefs.category_slugs.length > 0) {
        setPrimaryCategory(prefs.category_slugs[0]);
      } else if (user?.category_slugs && user.category_slugs.length > 0) {
        setPrimaryCategory(user.category_slugs[0]);
      }

      setCategories(catsRes.categories || []);
      setHistory(histRes.logs || []);
    } catch (err) {
      console.error('Failed to load digest settings:', err);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Save preferences
  const handleSave = async () => {
    try {
      setSaving(true);
      setSaved(false);
      setError('');

      await updateDigestPreferences({
        enabled,
        frequency,
        primary_category_slug: primaryCategory,
        category_slugs: primaryCategory ? [primaryCategory] : [],
        jurisdictions: [],
        feed_types: ['news', 'blogpost', 'judgment', 'regulatory', 'legislation', 'procurement'],
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save digest preferences:', err);
      setError('Failed to save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const lensName = frequency === 'daily' ? 'The Daily Lens' : 'The Weekly Lens';

  // Format last digest info
  const lastSent = history.find(h => h.status === 'sent');
  const lastSentLabel = lastSent
    ? `Last sent ${new Date(lastSent.sent_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} — ${lastSent.article_count} articles`
    : null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-y-0 right-0 w-full max-w-lg z-50 panel-enter">
        <div className="h-full bg-brand-bg border-l border-brand-border shadow-2xl flex flex-col">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border bg-white">
            <div>
              <h2 className="font-heading text-lg font-semibold text-brand-heading">
                {lensName}
              </h2>
              <p className="text-xs text-brand-muted mt-0.5">
                AI-curated legal intelligence delivered to your inbox
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-brand-bg transition-colors text-brand-muted hover:text-brand-body"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {loading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-12 bg-brand-border/30 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-6">

                {/* Enable Toggle */}
                <div className="flex items-center justify-between bg-white rounded-xl px-5 py-4 border border-brand-border">
                  <div>
                    <div className="text-sm font-semibold text-brand-heading">Enable {lensName}</div>
                    <div className="text-xs text-brand-muted mt-0.5">
                      {enabled ? `You will receive ${lensName} emails` : 'Currently disabled'}
                    </div>
                  </div>
                  <button
                    onClick={() => setEnabled(!enabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      enabled ? 'bg-brand-accent' : 'bg-brand-border'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                        enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Settings (dimmed when disabled) */}
                <div className={`space-y-5 transition-opacity ${enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>

                  {/* Frequency */}
                  <div>
                    <label className="block text-sm font-semibold text-brand-heading mb-2">Frequency</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setFrequency('daily')}
                        className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg border transition-all ${
                          frequency === 'daily'
                            ? 'bg-brand-accent text-white border-brand-accent shadow-sm'
                            : 'bg-white text-brand-body border-brand-border hover:border-brand-accent/30'
                        }`}
                      >
                        <div>Daily</div>
                        <div className={`text-xs mt-0.5 ${frequency === 'daily' ? 'text-white/70' : 'text-brand-muted'}`}>Every morning</div>
                      </button>
                      <button
                        onClick={() => setFrequency('weekly')}
                        className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg border transition-all ${
                          frequency === 'weekly'
                            ? 'bg-brand-accent text-white border-brand-accent shadow-sm'
                            : 'bg-white text-brand-body border-brand-border hover:border-brand-accent/30'
                        }`}
                      >
                        <div>Weekly</div>
                        <div className={`text-xs mt-0.5 ${frequency === 'weekly' ? 'text-white/70' : 'text-brand-muted'}`}>Monday morning</div>
                      </button>
                    </div>
                  </div>

                  {/* Format Description */}
                  <div className="bg-white rounded-xl px-5 py-4 border border-brand-border">
                    <div className="flex items-start gap-3">
                      <span className="text-lg">🔍</span>
                      <div className="text-xs text-brand-muted leading-relaxed">
                        {frequency === 'daily'
                          ? 'A short editorial summarizing the day\'s key developments in your practice area, followed by a compact reference list of all relevant articles.'
                          : 'A comprehensive weekly analysis with trends and insights in your practice area, followed by a reference list of the week\'s articles.'}
                      </div>
                    </div>
                  </div>

                  {/* Primary Practice Area */}
                  <div>
                    <label className="block text-sm font-semibold text-brand-heading mb-2">
                      Your Practice Area
                    </label>
                    <p className="text-xs text-brand-muted mb-2">
                      Choose the area of law your Lens editorial will focus on
                    </p>
                    <select
                      value={primaryCategory || ''}
                      onChange={(e) => setPrimaryCategory(e.target.value || null)}
                      className="w-full px-3 py-2.5 text-sm border border-brand-border rounded-lg bg-white text-brand-body focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent/20 transition-colors"
                    >
                      <option value="">Select a practice area...</option>
                      {categories.map(c => (
                        <option key={c.slug} value={c.slug}>{c.name}</option>
                      ))}
                    </select>
                    {!primaryCategory && (
                      <p className="text-xs text-brand-accent mt-1.5">
                        Please select a practice area to receive the editorial briefing
                      </p>
                    )}
                  </div>
                </div>

                {/* Last digest info */}
                {lastSentLabel && (
                  <div className="text-xs text-brand-muted text-center pt-2 border-t border-brand-border">
                    {lastSentLabel}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          {!loading && (
            <div className="px-6 py-4 border-t border-brand-border bg-white">
              {error && (
                <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                  {error}
                </div>
              )}
              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-brand-body bg-brand-bg border border-brand-border rounded-lg hover:bg-brand-border/30 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className={`flex-1 px-4 py-2.5 text-sm font-semibold text-white rounded-lg transition-all ${
                    saved
                      ? 'bg-green-600'
                      : saving
                        ? 'bg-brand-accent/70 cursor-wait'
                        : 'bg-brand-accent hover:bg-brand-accentDark shadow-sm'
                  }`}
                >
                  {saved ? (
                    <span className="flex items-center justify-center gap-1.5">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                      Saved
                    </span>
                  ) : saving ? 'Saving...' : 'Save Preferences'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
