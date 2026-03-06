'use client';

import { useAuth } from '@/lib/auth-context';

export default function ArticleCTA({ articleId }: { articleId: number }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-12 w-48 mx-auto bg-brand-border/30 rounded-lg animate-pulse" />
    );
  }

  if (user) {
    return (
      <a
        href={`/?article=${articleId}`}
        onClick={(e) => { e.preventDefault(); window.location.href = `/?article=${articleId}`; }}
        className="inline-flex items-center gap-2 px-8 py-3 bg-brand-accent text-white font-semibold rounded-lg hover:bg-brand-accent/90 transition-colors shadow-md"
      >
        Open in LexLens
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
        </svg>
      </a>
    );
  }

  function saveRedirect() {
    try { sessionStorage.setItem('lexlens_redirect_article', String(articleId)); } catch {}
  }

  return (
    <div className="space-y-3">
      <a
        href="/"
        onClick={saveRedirect}
        className="inline-flex items-center gap-2 px-8 py-3 bg-brand-accent text-white font-semibold rounded-lg hover:bg-brand-accent/90 transition-colors shadow-md"
      >
        Sign up for free
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
        </svg>
      </a>
      <p className="text-brand-muted text-sm">
        Already have an account?{' '}
        <a href="/" onClick={saveRedirect} className="text-brand-accent font-medium hover:text-brand-accent/80">
          Sign in
        </a>
      </p>
    </div>
  );
}
