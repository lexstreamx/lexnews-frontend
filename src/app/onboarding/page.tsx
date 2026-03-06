'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { fetchCategories, completeOnboarding } from '@/lib/api';
import { Category } from '@/types';

// Curated jurisdiction list for onboarding — EU/legal platform focus
const ONBOARDING_JURISDICTIONS = [
  'EU',
  'Portugal',
  'Austria',
  'Belgium',
  'Bulgaria',
  'Croatia',
  'Cyprus',
  'Czech Republic',
  'Denmark',
  'Estonia',
  'Finland',
  'France',
  'Germany',
  'Greece',
  'Hungary',
  'Ireland',
  'Italy',
  'Latvia',
  'Lithuania',
  'Luxembourg',
  'Malta',
  'Netherlands',
  'Poland',
  'Romania',
  'Slovakia',
  'Slovenia',
  'Spain',
  'Sweden',
  'Norway',
  'Switzerland',
  'UK',
  'International',
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading: authLoading, setUser } = useAuth();

  const [step, setStep] = useState<1 | 2>(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  // Redirect guard — only show onboarding for logged-in users who haven't completed it
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/');
        return;
      }
      if (user.onboarding_completed) {
        router.push('/');
        return;
      }
    }
  }, [user, authLoading, router]);

  // Fetch categories (jurisdictions are curated, no need to fetch)
  useEffect(() => {
    fetchCategories()
      .then((catData) => {
        setCategories(catData.categories || []);
      })
      .catch(() => {
        setError('Failed to load data. Please refresh the page.');
      })
      .finally(() => setDataLoading(false));
  }, []);

  function toggleCategory(slug: string) {
    setSelectedCategories(prev =>
      prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
    );
  }

  async function handleComplete() {
    if (selectedCategories.length === 0) {
      setError('Please select at least one area of law.');
      return;
    }
    if (!selectedJurisdiction) {
      setError('Please select a jurisdiction.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const data = await completeOnboarding(selectedCategories, selectedJurisdiction);
      if (data.user) {
        setUser(data.user);
      }
      // Check for pending article redirect from shared link
      let redirectUrl = '/';
      try {
        const pendingArticle = sessionStorage.getItem('lexlens_redirect_article');
        if (pendingArticle) {
          redirectUrl = `/?article=${pendingArticle}`;
          sessionStorage.removeItem('lexlens_redirect_article');
        }
      } catch {}
      router.push(redirectUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save preferences.');
      setSaving(false);
    }
  }

  // Show loading state while auth or data is loading
  if (authLoading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg">
        <div className="w-8 h-8 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Don't render if user shouldn't be here
  if (!user || user.onboarding_completed) {
    return null;
  }

  return (
    <div className="min-h-[100dvh] bg-brand-bg">
      {/* Header */}
      <div className="bg-brand-sidebar">
        <div className="max-w-2xl mx-auto px-6 py-6 flex items-center justify-between">
          <div>
            <img src="/logo-white.svg" alt="LexLens" className="h-8 mb-1" />
            <p className="text-[#8A9A7C] text-xs">Legal Intelligence</p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
              step >= 1 ? 'bg-brand-accent text-white' : 'bg-[#3A4A2C] text-[#8A9A7C]'
            }`}>1</div>
            <div className={`w-6 h-0.5 ${step >= 2 ? 'bg-brand-accent' : 'bg-[#3A4A2C]'}`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
              step >= 2 ? 'bg-brand-accent text-white' : 'bg-[#3A4A2C] text-[#8A9A7C]'
            }`}>2</div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="font-heading text-2xl font-bold text-brand-heading mb-2">
            Welcome to LexLens{user.display_name ? `, ${user.display_name.split(' ')[0]}` : ''}!
          </h1>
          <p className="text-brand-muted text-sm">
            Let&apos;s personalise your feed. This takes about 30 seconds.
          </p>
        </div>

        {/* Step 1: Areas of Law */}
        {step === 1 && (
          <div>
            <h2 className="font-heading text-lg font-bold text-brand-heading mb-1">
              Select your areas of law
            </h2>
            <p className="text-brand-muted text-sm mb-6">
              Choose the legal areas you&apos;re interested in. You can change these later.
            </p>

            <div className="flex flex-wrap gap-2 mb-8">
              {categories.map(cat => (
                <button
                  key={cat.slug}
                  onClick={() => toggleCategory(cat.slug)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer border ${
                    selectedCategories.includes(cat.slug)
                      ? 'bg-brand-accent text-white border-brand-accent shadow-sm'
                      : 'bg-white text-brand-body border-brand-border hover:border-brand-accent/40'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {selectedCategories.length > 0 && (
              <p className="text-brand-muted text-xs mb-4">
                {selectedCategories.length} area{selectedCategories.length !== 1 ? 's' : ''} selected
              </p>
            )}

            <button
              onClick={() => {
                if (selectedCategories.length === 0) {
                  setError('Please select at least one area of law.');
                  return;
                }
                setError(null);
                setStep(2);
              }}
              disabled={selectedCategories.length === 0}
              className="w-full sm:w-auto px-8 py-2.5 bg-brand-accent text-white font-semibold rounded-lg hover:bg-brand-accent/90 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 2: Jurisdiction */}
        {step === 2 && (
          <div>
            <h2 className="font-heading text-lg font-bold text-brand-heading mb-1">
              Select your jurisdiction
            </h2>
            <p className="text-brand-muted text-sm mb-6">
              Choose your primary jurisdiction to prioritise relevant content.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-8">
              {ONBOARDING_JURISDICTIONS.map(j => (
                <button
                  key={j}
                  onClick={() => setSelectedJurisdiction(j)}
                  className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer border text-left ${
                    selectedJurisdiction === j
                      ? 'bg-brand-accent text-white border-brand-accent shadow-sm'
                      : 'bg-white text-brand-body border-brand-border hover:border-brand-accent/40'
                  }`}
                >
                  {j}
                </button>
              ))}
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
                {error}
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-2.5 text-brand-muted hover:text-brand-body font-medium rounded-lg transition-colors cursor-pointer"
              >
                Back
              </button>
              <button
                onClick={handleComplete}
                disabled={saving || !selectedJurisdiction}
                className="px-8 py-2.5 bg-brand-accent text-white font-semibold rounded-lg hover:bg-brand-accent/90 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {saving ? 'Saving...' : 'Complete setup'}
              </button>
            </div>
          </div>
        )}

        {/* Error on step 1 */}
        {step === 1 && error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-4">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
