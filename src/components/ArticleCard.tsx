'use client';

import { Article, ViewMode } from '@/types';
import { saveArticle, unsaveArticle, markRead, markUnread } from '@/lib/api';
import { useState } from 'react';

export const FEED_TYPE_LABELS: Record<string, string> = {
  news: 'News',
  blogpost: 'Blogpost',
  judgment: 'Caselaw',
  regulatory: 'Regulatory',
};

export const FEED_TYPE_COLORS: Record<string, string> = {
  news: 'bg-blue-100 text-blue-800',
  blogpost: 'bg-blue-100 text-blue-800',
  judgment: 'bg-amber-100 text-amber-800',
  regulatory: 'bg-green-100 text-green-800',
};

export const FEED_TYPE_GRADIENTS: Record<string, string> = {
  news: 'from-blue-500/20 to-blue-600/10',
  blogpost: 'from-blue-500/20 to-blue-600/10',
  judgment: 'from-amber-500/20 to-amber-600/10',
  regulatory: 'from-green-500/20 to-green-600/10',
};

export function timeAgo(dateStr: string): string {
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

export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}

export function FeedTypeIcon({ feedType }: { feedType: string }) {
  switch (feedType) {
    case 'news':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-10 h-10 text-brand-muted">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5M6 7.5h3v3H6V7.5Z" />
        </svg>
      );
    case 'blogpost':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-10 h-10 text-brand-muted">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
        </svg>
      );
    case 'judgment':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-10 h-10 text-brand-muted">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0 0 12 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 0 1-2.031.352 5.988 5.988 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971Zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 0 1-2.031.352 5.989 5.989 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971Z" />
        </svg>
      );
    default:
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-10 h-10 text-brand-muted">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
        </svg>
      );
  }
}

export function BookmarkIcon({ saved }: { saved: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill={saved ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={saved ? 0 : 1.5}
      className={`w-4 h-4 ${saved ? 'text-brand-accent' : ''}`}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z"
      />
    </svg>
  );
}

export function ImagePlaceholder({ feedType }: { feedType: string }) {
  return (
    <div className={`absolute inset-0 bg-gradient-to-br ${FEED_TYPE_GRADIENTS[feedType] || 'from-gray-200 to-gray-100'} flex items-center justify-center`}>
      <FeedTypeIcon feedType={feedType} />
    </div>
  );
}

interface ArticleCardProps {
  article: Article;
  view: ViewMode;
  onSelect?: (article: Article) => void;
  isSelected?: boolean;
  onReadChange?: (article: Article, isRead: boolean) => void;
  onCategoryClick?: (slug: string) => void;
}

export default function ArticleCard({ article, view, onSelect, isSelected, onReadChange, onCategoryClick }: ArticleCardProps) {
  const [saved, setSaved] = useState(article.is_saved);
  const [saving, setSaving] = useState(false);
  const [read, setRead] = useState(article.is_read);
  const [expanded, setExpanded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const jm = article.judgment;
  const showPlaceholder = !article.image_url || imgError;

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

  async function toggleRead(e: React.MouseEvent) {
    e.stopPropagation();
    const newRead = !read;
    setRead(newRead);
    onReadChange?.(article, newRead);
    try {
      if (newRead) {
        await markRead(article.id);
      } else {
        await markUnread(article.id);
      }
    } catch {
      setRead(!newRead);
    }
  }

  if (view === 'card') {
    return (
      <article
        onClick={() => onSelect?.(article)}
        className={`article-enter bg-brand-bg-card border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-200 group flex flex-col h-full ${onSelect ? 'cursor-pointer' : ''} ${isSelected ? 'border-brand-accent ring-2 ring-brand-accent/20' : 'border-brand-border'}`}
      >
        {/* Image */}
        <div className="relative aspect-video overflow-hidden bg-brand-bg flex-shrink-0">
          {!showPlaceholder && (
            <img
              src={article.image_url!}
              alt=""
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
              onError={() => setImgError(true)}
            />
          )}
          {showPlaceholder && <ImagePlaceholder feedType={article.feed_type} />}

          {/* Overlay badges */}
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-md ${article.feed_type === 'news' ? 'bg-brand-body text-white' : article.feed_type === 'blogpost' ? 'bg-brand-body text-white' : article.feed_type === 'judgment' ? 'bg-amber-700 text-white' : 'bg-green-700 text-white'}`}>
              {FEED_TYPE_LABELS[article.feed_type] || article.feed_type}
            </span>
            {article.jurisdiction && (
              <span className="text-xs font-medium px-2 py-1 rounded-md bg-white/90 text-brand-body backdrop-blur-sm">
                {article.jurisdiction}
              </span>
            )}
          </div>

          {/* Read/Unread + Bookmark */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5">
            <button
              onClick={toggleRead}
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-md shadow-sm transition-colors cursor-pointer ${
                read ? 'bg-brand-accent text-white' : 'bg-[#DDEAE3] text-brand-body'
              }`}
            >
              {read ? 'Read' : 'Unread'}
            </button>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => { e.stopPropagation(); toggleSave(); }}
                disabled={saving}
                className={`p-2 rounded-md shadow-sm transition-colors cursor-pointer ${saved ? 'bg-brand-accent text-white' : 'bg-white/90 hover:bg-brand-body text-gray-600 hover:text-white'}`}
              >
                <BookmarkIcon saved={saved} />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-1 min-h-0">
          <div className="group/title cursor-pointer">
            <h3 className="font-heading text-base font-semibold text-brand-body group-hover/title:text-brand-accent transition-colors leading-snug line-clamp-2 mb-2">
              {article.title}
            </h3>
          </div>

          {/* Categories */}
          {article.categories.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded whitespace-nowrap border border-gray-200 flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                  <circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" />
                </svg>
                {extractDomain(article.link)}
              </span>
              {article.categories.slice(0, 2).map((cat) => (
                <button
                  key={cat.id}
                  onClick={(e) => { e.stopPropagation(); onCategoryClick?.(cat.slug); }}
                  className="px-2 py-0.5 bg-brand-body/85 text-white text-xs rounded whitespace-nowrap hover:bg-brand-accent transition-colors cursor-pointer"
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}

          {/* Description */}
          {article.description && (
            <p className="text-sm text-brand-muted mb-3 flex-1 overflow-hidden line-clamp-3 leading-relaxed">
              {article.description}
            </p>
          )}

          {/* Judgment AI summary toggle */}
          {jm?.ai_summary && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                className="text-xs text-brand-accent hover:underline font-medium mb-2 text-left"
              >
                {expanded ? 'Hide summary' : 'AI Summary'}
              </button>
              {expanded && (
                <div className="mb-3 p-3 bg-brand-bg rounded-lg border border-brand-border text-sm text-brand-body leading-relaxed whitespace-pre-line line-clamp-[8]">
                  {jm.ai_summary}
                </div>
              )}
            </>
          )}

          {/* Footer */}
          <div className="flex items-center gap-2 text-xs text-brand-muted mt-auto pt-2 border-t border-brand-border">
            <span>{timeAgo(article.published_at)}</span>
          </div>
        </div>
      </article>
    );
  }

  // List view
  const opacity = Math.max(0.4, Math.min(1, article.relevance_score));

  return (
    <article
      onClick={() => onSelect?.(article)}
      className={`article-enter bg-brand-bg-card border rounded-lg p-4 hover:border-brand-accent/30 transition-all duration-200 group flex gap-4 ${onSelect ? 'cursor-pointer' : ''} ${isSelected ? 'border-brand-accent ring-2 ring-brand-accent/20' : 'border-brand-border'}`}
      style={{ opacity }}
    >
      {/* Thumbnail */}
      <div className="flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden bg-brand-bg relative">
        {!showPlaceholder && (
          <img
            src={article.image_url!}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        )}
        {showPlaceholder && (
          <div className={`w-full h-full bg-gradient-to-br ${FEED_TYPE_GRADIENTS[article.feed_type] || 'from-gray-200 to-gray-100'} flex items-center justify-center`}>
            <FeedTypeIcon feedType={article.feed_type} />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Feed type + jurisdiction + time */}
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
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
        <div className="group/title cursor-pointer">
          <h3 className="font-heading text-base font-semibold text-brand-body group-hover/title:text-brand-accent transition-colors leading-snug line-clamp-1">
            {article.title}
          </h3>
        </div>

        {/* Description */}
        {article.description && (
          <p className="mt-1 text-sm text-brand-muted line-clamp-1 leading-relaxed">
            {article.description}
          </p>
        )}

        {/* Judgment metadata */}
        {jm && (
          <div className="flex items-center gap-2 mt-1.5 flex-wrap text-xs text-brand-muted">
            {jm.court && <span>{jm.court}</span>}
            {jm.document_type && <><span className="opacity-40">|</span><span>{jm.document_type}</span></>}
            {jm.ecli && <span className="opacity-60 font-mono text-[10px]">{jm.ecli}</span>}
            {jm.ai_summary && (
              <button
                onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                className="ml-auto text-brand-accent hover:underline font-medium"
              >
                {expanded ? 'Hide' : 'AI Summary'}
              </button>
            )}
          </div>
        )}

        {/* Expanded AI summary */}
        {expanded && jm?.ai_summary && (
          <div className="mt-2 p-3 bg-brand-bg rounded-lg border border-brand-border text-sm text-brand-body leading-relaxed whitespace-pre-line">
            {jm.ai_summary}
          </div>
        )}

        {/* Categories + source */}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {article.categories.slice(0, 3).map((cat) => (
            <button
              key={cat.id}
              onClick={(e) => { e.stopPropagation(); onCategoryClick?.(cat.slug); }}
              className="text-xs px-2 py-0.5 rounded bg-brand-accent/10 text-brand-accent font-medium hover:bg-brand-accent hover:text-white transition-colors cursor-pointer"
            >
              {cat.name}
            </button>
          ))}
          <span className="text-xs text-brand-muted ml-auto">
            {extractDomain(article.link)}
          </span>
        </div>
      </div>

      {/* Read/Unread + Bookmark */}
      <div className="flex flex-col items-center gap-1.5 flex-shrink-0 self-start">
        <button
          onClick={toggleRead}
          className={`text-[10px] font-semibold px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
            read ? 'bg-brand-accent text-white' : 'bg-[#DDEAE3] text-brand-body'
          }`}
        >
          {read ? 'Read' : 'Unread'}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); toggleSave(); }}
          disabled={saving}
          className="p-2 rounded-lg hover:bg-brand-bg-hover transition-colors"
          title={saved ? 'Remove from saved' : 'Save for later'}
        >
          <BookmarkIcon saved={saved} />
        </button>
      </div>
    </article>
  );
}
