'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { fetchAdminOverview, fetchAdminEngagement } from '@/lib/api';

// ─── Types ──────────────────────────────────────────────────────────

interface OverviewData {
  users: { total: number; learnworlds: number; standalone: number; onboarded: number };
  signups: Array<{ date: string; signups: number }>;
  categoryPreferences: Array<{ slug: string; user_count: number }>;
  jurisdictionDistribution: Array<{ jurisdiction: string; user_count: number }>;
  articlesByFeedType: Array<{ feed_type: string; article_count: number }>;
  totalArticles: number;
}

interface EngagementData {
  interactions: {
    total: { reads: number; saves: number; important: number };
    last7d: { reads: number; saves: number; important: number };
  };
  mostReadArticles: Array<{
    id: number; title: string; feed_type: string;
    published_at: string; source_name: string; read_count: number;
  }>;
  mostSavedArticles: Array<{
    id: number; title: string; feed_type: string;
    published_at: string; source_name: string; save_count: number;
  }>;
  activeUsers: { last7d: number; last30d: number; total: number };
  digest: {
    allTime: { sent: number; failed: number; skipped: number };
    last7d: { sent: number; failed: number; skipped: number };
  };
}

type Tab = 'overview' | 'engagement';

// ─── Label maps ─────────────────────────────────────────────────────

const FEED_TYPE_LABELS: Record<string, string> = {
  news: 'News',
  blogpost: 'Blogposts',
  judgment: 'Case Law',
  regulatory: 'Regulatory',
  legislation: 'Legislation',
  procurement: 'Procurement',
  competition: 'Competition',
};

const CATEGORY_LABELS: Record<string, string> = {
  'ai-platforms-data-protection': 'AI & Data Protection',
  'administrative': 'Administrative',
  'banking-finance': 'Banking & Finance',
  'capital-markets-securities': 'Capital Markets',
  'competition-antitrust': 'Competition / Antitrust',
  'construction-real-estate': 'Construction & Real Estate',
  'consumer-protection': 'Consumer Protection',
  'corporate-company': 'Corporate / Company',
  'criminal': 'Criminal',
  'employment-labour': 'Employment & Labour',
  'energy': 'Energy',
  'environmental': 'Environmental',
  'family': 'Family',
  'life-sciences': 'Life Sciences',
  'immigration': 'Immigration',
  'infrastructure-procurement': 'Infrastructure & Procurement',
  'media-telecom': 'Media & Telecom',
  'insolvency-restructuring': 'Insolvency & Restructuring',
  'insurance': 'Insurance',
  'intellectual-property': 'Intellectual Property',
  'international-trade-customs': 'International Trade & Customs',
  'litigation-dispute-resolution': 'Litigation & Disputes',
  'mergers-acquisitions': 'M&A',
  'private-equity-vc': 'Private Equity & VC',
  'constitutional': 'Constitutional',
  'sports-entertainment': 'Sports & Entertainment',
  'tax': 'Tax',
  'transport-logistics': 'Transport & Logistics',
};

// ─── Helpers ────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString('en-US');
}

function fmtDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

// ─── Sub-components ─────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white border border-brand-border rounded-xl p-5">
      <p className="text-brand-muted text-xs font-medium uppercase tracking-wide mb-1">{label}</p>
      <p className="font-heading text-2xl font-bold text-brand-heading">{typeof value === 'number' ? fmt(value) : value}</p>
      {sub && <p className="text-brand-muted text-xs mt-1">{sub}</p>}
    </div>
  );
}

function BarChart({ data, labelKey, valueKey, labelMap }: {
  data: Array<Record<string, string | number>>;
  labelKey: string;
  valueKey: string;
  labelMap?: Record<string, string>;
}) {
  const max = Math.max(...data.map(d => Number(d[valueKey])), 1);
  return (
    <div className="space-y-1.5">
      {data.map((item, i) => {
        const rawLabel = String(item[labelKey]);
        const displayLabel = labelMap?.[rawLabel] || rawLabel;
        const val = Number(item[valueKey]);
        return (
          <div key={i} className="flex items-center gap-3">
            <span className="text-xs text-brand-muted w-28 truncate text-right shrink-0">{displayLabel}</span>
            <div className="flex-1 bg-brand-bg rounded-full h-5 overflow-hidden">
              <div
                className="h-full bg-brand-accent rounded-full transition-all duration-300"
                style={{ width: `${Math.max((val / max) * 100, 2)}%` }}
              />
            </div>
            <span className="text-xs font-medium text-brand-body w-12 text-right shrink-0">{fmt(val)}</span>
          </div>
        );
      })}
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-brand-border rounded-xl p-5">
      <h3 className="font-heading text-sm font-semibold text-brand-heading mb-4">{title}</h3>
      {children}
    </div>
  );
}

function DataTable({ headers, rows }: { headers: string[]; rows: (string | number)[][] }) {
  return (
    <div className="overflow-x-auto max-h-72 overflow-y-auto">
      <table className="w-full text-xs">
        <thead className="sticky top-0 bg-white">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className={`py-1.5 px-2 text-brand-muted font-medium uppercase tracking-wide border-b border-brand-border ${i === 0 ? 'text-left' : 'text-right'}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-brand-border/50 last:border-0">
              {row.map((cell, j) => (
                <td key={j} className={`py-1.5 px-2 text-brand-body ${j === 0 ? 'text-left' : 'text-right font-medium'}`}>
                  {typeof cell === 'number' ? fmt(cell) : cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ArticleList({ articles, countKey, countLabel }: {
  articles: Array<{ id: number; title: string; feed_type: string; source_name: string; [k: string]: string | number }>;
  countKey: string;
  countLabel: string;
}) {
  return (
    <div className="space-y-2">
      {articles.map((a, i) => (
        <div key={a.id} className="flex items-start gap-3 py-2 border-b border-brand-border/50 last:border-0">
          <span className="text-xs font-medium text-brand-muted w-5 shrink-0 pt-0.5">{i + 1}.</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-brand-body font-medium truncate">{a.title}</p>
            <p className="text-[10px] text-brand-muted mt-0.5">
              <span className="inline-block px-1.5 py-0.5 bg-brand-bg rounded text-[10px] font-medium mr-1.5">
                {FEED_TYPE_LABELS[a.feed_type] || a.feed_type}
              </span>
              {a.source_name}
            </p>
          </div>
          <span className="text-xs font-semibold text-brand-accent shrink-0">{a[countKey]} {countLabel}</span>
        </div>
      ))}
      {articles.length === 0 && (
        <p className="text-xs text-brand-muted py-4 text-center">No data yet</p>
      )}
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────

export default function AdminPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [tab, setTab] = useState<Tab>('overview');
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [engagement, setEngagement] = useState<EngagementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  // Load data
  useEffect(() => {
    if (!user) return;

    async function loadData() {
      try {
        const [overviewData, engagementData] = await Promise.all([
          fetchAdminOverview(),
          fetchAdminEngagement(),
        ]);
        setOverview(overviewData);
        setEngagement(engagementData);
      } catch (err) {
        if (err instanceof Error && err.message === 'Forbidden') {
          setError('forbidden');
        } else {
          setError('Failed to load admin data.');
        }
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg">
        <div className="w-8 h-8 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Forbidden
  if (error === 'forbidden') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg">
        <div className="text-center">
          <h1 className="font-heading text-2xl font-bold text-brand-heading mb-2">Access Denied</h1>
          <p className="text-brand-muted text-sm">You do not have admin access.</p>
          <button onClick={() => router.push('/')} className="mt-4 px-4 py-2 bg-brand-accent text-white rounded-lg text-sm hover:opacity-90 transition-opacity">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg">
        <div className="text-center">
          <h1 className="font-heading text-xl font-bold text-red-700 mb-2">Error</h1>
          <p className="text-brand-muted text-sm">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-brand-accent text-white rounded-lg text-sm hover:opacity-90 transition-opacity">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!overview || !engagement) return null;

  return (
    <div className="min-h-screen bg-brand-bg">
      {/* Header */}
      <div className="bg-white border-b border-brand-border sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-heading text-lg font-bold text-brand-heading">Admin Dashboard</h1>
            <p className="text-xs text-brand-muted">LexLens — Internal Analytics</p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="text-xs text-brand-muted hover:text-brand-body transition-colors"
          >
            ← Back to app
          </button>
        </div>

        {/* Tab navigation */}
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-1">
            {(['overview', 'engagement'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 ${
                  tab === t
                    ? 'border-brand-accent text-brand-accent'
                    : 'border-transparent text-brand-muted hover:text-brand-body'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {tab === 'overview' && (
          <>
            {/* Stats row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Total Users" value={overview.users.total} sub={`${overview.users.onboarded} onboarded`} />
              <StatCard label="LearnWorlds" value={overview.users.learnworlds} />
              <StatCard label="Standalone" value={overview.users.standalone} />
              <StatCard label="Total Articles" value={overview.totalArticles} />
            </div>

            {/* Signups chart */}
            {overview.signups.length > 0 && (
              <SectionCard title="New Signups (Last 30 Days)">
                <BarChart
                  data={overview.signups.map(s => ({ ...s, dateLabel: fmtDate(s.date) }))}
                  labelKey="dateLabel"
                  valueKey="signups"
                />
              </SectionCard>
            )}

            {/* Articles by feed type */}
            <SectionCard title="Articles by Feed Type">
              <BarChart
                data={overview.articlesByFeedType}
                labelKey="feed_type"
                valueKey="article_count"
                labelMap={FEED_TYPE_LABELS}
              />
            </SectionCard>

            {/* Category prefs + Jurisdictions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <SectionCard title="Category Preferences (Onboarding)">
                <DataTable
                  headers={['Category', 'Users']}
                  rows={overview.categoryPreferences.map(c => [
                    CATEGORY_LABELS[c.slug] || c.slug,
                    c.user_count,
                  ])}
                />
              </SectionCard>

              <SectionCard title="User Jurisdictions">
                <DataTable
                  headers={['Jurisdiction', 'Users']}
                  rows={overview.jurisdictionDistribution.map(j => [
                    j.jurisdiction,
                    j.user_count,
                  ])}
                />
              </SectionCard>
            </div>
          </>
        )}

        {tab === 'engagement' && (
          <>
            {/* Interaction stats */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard
                label="Articles Read"
                value={engagement.interactions.total.reads}
                sub={`${fmt(engagement.interactions.last7d.reads)} in last 7 days`}
              />
              <StatCard
                label="Articles Saved"
                value={engagement.interactions.total.saves}
                sub={`${fmt(engagement.interactions.last7d.saves)} in last 7 days`}
              />
              <StatCard
                label="Marked Important"
                value={engagement.interactions.total.important}
                sub={`${fmt(engagement.interactions.last7d.important)} in last 7 days`}
              />
            </div>

            {/* Active users + Digest */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <SectionCard title="Active Users">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="font-heading text-xl font-bold text-brand-heading">{fmt(engagement.activeUsers.last7d)}</p>
                    <p className="text-xs text-brand-muted mt-1">Last 7 days</p>
                  </div>
                  <div>
                    <p className="font-heading text-xl font-bold text-brand-heading">{fmt(engagement.activeUsers.last30d)}</p>
                    <p className="text-xs text-brand-muted mt-1">Last 30 days</p>
                  </div>
                  <div>
                    <p className="font-heading text-xl font-bold text-brand-heading">{fmt(engagement.activeUsers.total)}</p>
                    <p className="text-xs text-brand-muted mt-1">Total registered</p>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Digest Performance">
                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-brand-muted font-medium mb-1.5">All Time</p>
                    <div className="flex gap-4">
                      <span className="text-xs"><span className="font-semibold text-green-700">{fmt(engagement.digest.allTime.sent)}</span> sent</span>
                      <span className="text-xs"><span className="font-semibold text-yellow-700">{fmt(engagement.digest.allTime.skipped)}</span> skipped</span>
                      <span className="text-xs"><span className="font-semibold text-red-700">{fmt(engagement.digest.allTime.failed)}</span> failed</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-brand-muted font-medium mb-1.5">Last 7 Days</p>
                    <div className="flex gap-4">
                      <span className="text-xs"><span className="font-semibold text-green-700">{fmt(engagement.digest.last7d.sent)}</span> sent</span>
                      <span className="text-xs"><span className="font-semibold text-yellow-700">{fmt(engagement.digest.last7d.skipped)}</span> skipped</span>
                      <span className="text-xs"><span className="font-semibold text-red-700">{fmt(engagement.digest.last7d.failed)}</span> failed</span>
                    </div>
                  </div>
                </div>
              </SectionCard>
            </div>

            {/* Most read + Most saved */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <SectionCard title="Most Read Articles">
                <ArticleList articles={engagement.mostReadArticles} countKey="read_count" countLabel="reads" />
              </SectionCard>

              <SectionCard title="Most Saved Articles">
                <ArticleList articles={engagement.mostSavedArticles} countKey="save_count" countLabel="saves" />
              </SectionCard>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
