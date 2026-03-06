import { Metadata } from 'next';
import { FEED_TYPE_LABELS, FEED_TYPE_COLORS } from '@/components/ArticleCard';
import ArticleCTA from './ArticleCTA';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://lexnews-backend-d0f19fef512a.herokuapp.com/api';

interface ArticleData {
  id: number;
  title: string;
  description: string | null;
  image_url: string | null;
  source_name: string;
  published_at: string;
  feed_type: string;
  jurisdiction: string | null;
  link: string;
  categories: { name: string; slug: string }[];
  important_count: number;
  judgment: {
    court: string;
    case_number: string;
    parties: string;
    document_type: string;
    decision_date: string;
    ecli: string;
  } | null;
  competition: {
    case_number: string;
    case_instrument: string;
    companies: string[];
  } | null;
}

async function fetchArticle(id: string): Promise<ArticleData | null> {
  try {
    const res = await fetch(`${API_BASE}/public/articles/${id}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.article;
  } catch {
    return null;
  }
}

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const article = await fetchArticle(id);

  if (!article) {
    return {
      title: 'Article Not Found | LexLens',
      description: 'This article could not be found.',
    };
  }

  const ogDescription = article.description
    ? article.description.substring(0, 200) + (article.description.length > 200 ? '...' : '')
    : 'Read this legal article on LexLens — Legal Intelligence Platform';

  return {
    title: `${article.title} | LexLens`,
    description: ogDescription,
    openGraph: {
      title: article.title,
      description: ogDescription,
      url: `https://lexlens.lexstream.io/article/${id}`,
      siteName: 'LexLens',
      images: article.image_url
        ? [{ url: article.image_url, alt: article.title }]
        : [{ url: '/logo_chocolate.png', alt: 'LexLens' }],
      type: 'article',
      publishedTime: article.published_at,
    },
    twitter: {
      card: article.image_url ? 'summary_large_image' : 'summary',
      title: article.title,
      description: ogDescription,
      images: article.image_url ? [article.image_url] : ['/logo_chocolate.png'],
    },
  };
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export default async function ArticlePage({ params }: Props) {
  const { id } = await params;
  const article = await fetchArticle(id);

  if (!article) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <img src="/logo_chocolate.png" alt="LexLens" className="h-12 mx-auto" />
          <h1 className="font-heading text-xl font-bold text-brand-heading">Article not found</h1>
          <p className="text-brand-muted text-sm">This article may have been removed or the link is invalid.</p>
          <a href="/" className="inline-block px-6 py-2.5 bg-brand-accent text-white font-semibold rounded-lg hover:bg-brand-accent/90 transition-colors">
            Go to LexLens
          </a>
        </div>
      </div>
    );
  }

  const feedLabel = FEED_TYPE_LABELS[article.feed_type] || article.feed_type;
  const feedColor = FEED_TYPE_COLORS[article.feed_type] || 'bg-gray-100 text-gray-700';

  return (
    <div className="min-h-screen bg-brand-bg">
      {/* Header */}
      <header className="bg-brand-sidebar py-4">
        <div className="max-w-2xl mx-auto px-4 flex items-center gap-3">
          <img src="/logo-white.svg" alt="LexLens" className="h-7" />
          <span className="text-[#8A9A7C] text-sm font-medium">Legal Intelligence</span>
        </div>
      </header>

      {/* Article content */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        <article className="bg-white rounded-2xl shadow-sm border border-brand-border overflow-hidden">
          {/* Image */}
          {article.image_url && (
            <div className="aspect-video w-full overflow-hidden">
              <img
                src={article.image_url}
                alt={article.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="p-6 sm:p-8 space-y-5">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${feedColor}`}>
                {feedLabel}
              </span>
              {article.jurisdiction && (
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-brand-bg text-brand-muted border border-brand-border">
                  {article.jurisdiction}
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-brand-heading leading-tight">
              {article.title}
            </h1>

            {/* Source & date */}
            <div className="flex items-center gap-3 text-sm text-brand-muted">
              {article.source_name && (
                <span className="flex items-center gap-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
                  </svg>
                  {article.source_name}
                </span>
              )}
              <span>{formatDate(article.published_at)}</span>
            </div>

            {/* Description */}
            {article.description && (
              <p className="text-brand-body text-sm sm:text-base leading-relaxed">
                {article.description}
              </p>
            )}

            {/* Judgment metadata */}
            {article.judgment && (
              <div className="bg-brand-bg rounded-xl p-4 space-y-2">
                <h3 className="text-xs font-bold text-brand-heading uppercase tracking-wider">Case Details</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {article.judgment.court && (
                    <div>
                      <span className="text-brand-muted text-xs">Court</span>
                      <p className="text-brand-body font-medium">{article.judgment.court}</p>
                    </div>
                  )}
                  {article.judgment.case_number && (
                    <div>
                      <span className="text-brand-muted text-xs">Case</span>
                      <p className="text-brand-body font-medium">{article.judgment.case_number}</p>
                    </div>
                  )}
                  {article.judgment.parties && (
                    <div className="col-span-2">
                      <span className="text-brand-muted text-xs">Parties</span>
                      <p className="text-brand-body font-medium">{article.judgment.parties}</p>
                    </div>
                  )}
                  {article.judgment.decision_date && (
                    <div>
                      <span className="text-brand-muted text-xs">Decision</span>
                      <p className="text-brand-body font-medium">{formatDate(article.judgment.decision_date)}</p>
                    </div>
                  )}
                  {article.judgment.document_type && (
                    <div>
                      <span className="text-brand-muted text-xs">Type</span>
                      <p className="text-brand-body font-medium">{article.judgment.document_type}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Competition metadata */}
            {article.competition && (
              <div className="bg-brand-bg rounded-xl p-4 space-y-2">
                <h3 className="text-xs font-bold text-brand-heading uppercase tracking-wider">Competition Case</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {article.competition.case_number && (
                    <div>
                      <span className="text-brand-muted text-xs">Case</span>
                      <p className="text-brand-body font-medium">{article.competition.case_number}</p>
                    </div>
                  )}
                  {article.competition.case_instrument && (
                    <div>
                      <span className="text-brand-muted text-xs">Instrument</span>
                      <p className="text-brand-body font-medium">{article.competition.case_instrument}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Categories */}
            {article.categories && article.categories.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {article.categories.map((cat) => (
                  <span
                    key={cat.slug}
                    className="text-xs font-medium px-2.5 py-1 rounded-full bg-brand-accent/10 text-brand-accent"
                  >
                    {cat.name}
                  </span>
                ))}
              </div>
            )}

            {/* Social proof */}
            {article.important_count > 0 && (
              <p className="text-sm text-brand-muted flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-brand-accent">
                  <path d="M15.98 1.804a1 1 0 0 0-1.96 0l-.24 1.192a1 1 0 0 1-.784.785l-1.192.238a1 1 0 0 0 0 1.962l1.192.238a1 1 0 0 1 .785.785l.238 1.192a1 1 0 0 0 1.962 0l.238-1.192a1 1 0 0 1 .785-.785l1.192-.238a1 1 0 0 0 0-1.962l-1.192-.238a1 1 0 0 1-.785-.785l-.238-1.192ZM6.949 5.684a1 1 0 0 0-1.898 0l-.683 2.051a1 1 0 0 1-.633.633l-2.051.683a1 1 0 0 0 0 1.898l2.051.684a1 1 0 0 1 .633.632l.683 2.051a1 1 0 0 0 1.898 0l.683-2.051a1 1 0 0 1 .633-.633l2.051-.683a1 1 0 0 0 0-1.898l-2.051-.683a1 1 0 0 1-.633-.633L6.95 5.684ZM13.949 13.684a1 1 0 0 0-1.898 0l-.184.551a1 1 0 0 1-.632.633l-.551.183a1 1 0 0 0 0 1.898l.551.183a1 1 0 0 1 .633.633l.183.551a1 1 0 0 0 1.898 0l.184-.551a1 1 0 0 1 .632-.633l.551-.183a1 1 0 0 0 0-1.898l-.551-.184a1 1 0 0 1-.633-.632l-.183-.551Z" />
                </svg>
                {article.important_count} legal professional{article.important_count !== 1 ? 's' : ''} found this important
              </p>
            )}
          </div>
        </article>

        {/* CTA Section */}
        <div className="mt-8 text-center space-y-6">
          <div className="space-y-2">
            <h2 className="font-heading text-xl font-bold text-brand-heading">
              Want full access to legal intelligence?
            </h2>
            <p className="text-brand-muted text-sm max-w-md mx-auto">
              Join LexLens for AI-powered legal news, case law analysis, and regulatory updates — all in one place.
            </p>
          </div>

          <ArticleCTA articleId={article.id} />

          <div className="flex items-center gap-6 justify-center text-xs text-brand-muted pt-2">
            <span className="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
              Free to use
            </span>
            <span className="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
              AI-powered summaries
            </span>
            <span className="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
              EU & national coverage
            </span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 py-6 border-t border-brand-border">
        <div className="max-w-2xl mx-auto px-4 text-center text-xs text-brand-muted">
          <p>LexLens — Legal Intelligence Platform</p>
        </div>
      </footer>
    </div>
  );
}
