'use client';

import { Article } from '@/types';
import { saveArticle, unsaveArticle } from '@/lib/api';
import { useState } from 'react';

const FEED_TYPE_LABELS: Record<string, string> = {
  news: 'News',
  blogpost: 'Blogpost',
  judgment: 'Judgment',
  regulatory: 'Regulatory',
};

const FEED_TYPE_COLORS: Record<string, string> = {
  news: 'bg-blue-100 text-blue-800',
  blogpost: 'bg-purple-100 text-purple-800',
  judgment: 'bg-amber-100 text-amber-800',
  regulatory: 'bg-green-100 text-green-800',
};

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

interface ArticleCardProps {
  article: Article;
}

export default function ArticleCard({ article }: ArticleCardProps) {
  const [saved, setSaved] = useState(article.is_saved);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const opacity = Math.max(0.4, Math.min(1, article.relevance_score));
  const jm = article.judgment;

  async function toggleSave() {
    setSaving(true);
    try {
      if (saved) {
        await unsaveArticle(article.id);
        setSaved(false);
      } else {
        await saveArticle(article.id);
        setSaved(true);
      }
    } catch {
      // revert on error
    } finally {
      setSaving(false);
    }
  }

  return (
    <article
      className="article-enter bg-brand-bg-card border border-brand-border rounded-lg p-5 hover:border-brand-accent/30 transition-all duration-200"
      style={{ opacity }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Feed type + jurisdiction */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${FEED_TYPE_COLORS[article.feed_type] || 'bg-gray-100 text-gray-700'}`}>
              {FEED_TYPE_LABELS[article.feed_type] || article.feed_type}
            </span>
            {article.jurisdiction && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-brand-bg text-brand-muted border border-brand-border">
                {article.jurisdiction}
              </span>
            )}
            <span className="text-xs text-brand-muted">
              {timeAgo(article.published_at)}
            </span>
          </div>

          {/* Title */}
          <a
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            className="block group"
          >
            <h3 className="font-heading text-base font-semibold text-brand-body group-hover:text-brand-accent transition-colors leading-snug">
              {article.title}
            </h3>
          </a>

          {/* Description */}
          {article.description && (
            <p className="mt-1.5 text-sm text-brand-muted line-clamp-2 leading-relaxed">
              {article.description}
            </p>
          )}

          {/* Judgment metadata row */}
          {jm && (
            <div className="flex items-center gap-2 mt-2 flex-wrap text-xs text-brand-muted">
              {jm.court && <span>{jm.court}</span>}
              {jm.chamber && <><span className="opacity-40">|</span><span>{jm.chamber}</span></>}
              {jm.document_type && <><span className="opacity-40">|</span><span>{jm.document_type}</span></>}
              {jm.procedure_type && <><span className="opacity-40">|</span><span>{jm.procedure_type}</span></>}
              {jm.ecli && <span className="opacity-60 font-mono text-[10px]">{jm.ecli}</span>}
              {jm.ai_summary && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="ml-auto text-brand-accent hover:underline font-medium"
                >
                  {expanded ? 'Hide summary' : 'AI Summary'}
                </button>
              )}
            </div>
          )}

          {/* Expanded AI summary */}
          {expanded && jm?.ai_summary && (
            <div className="mt-3 p-3 bg-brand-bg rounded-lg border border-brand-border text-sm text-brand-body leading-relaxed whitespace-pre-line">
              {jm.ai_summary}
            </div>
          )}

          {/* Categories + source */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {article.categories.map((cat) => (
              <span
                key={cat.id}
                className="text-xs px-2 py-0.5 rounded bg-brand-accent/10 text-brand-accent font-medium"
              >
                {cat.name}
              </span>
            ))}
            {article.source_name && (
              <span className="text-xs text-brand-muted ml-auto">
                {article.source_name}
              </span>
            )}
          </div>
        </div>

        {/* Save button */}
        <button
          onClick={toggleSave}
          disabled={saving}
          className="flex-shrink-0 p-2 rounded-lg hover:bg-brand-bg-hover transition-colors"
          title={saved ? 'Remove from saved' : 'Save for later'}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill={saved ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth={saved ? 0 : 1.5}
            className={`w-5 h-5 ${saved ? 'text-brand-accent' : 'text-brand-muted'}`}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z"
            />
          </svg>
        </button>
      </div>
    </article>
  );
}
