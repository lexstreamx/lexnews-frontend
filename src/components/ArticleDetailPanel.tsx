'use client';

import { useState } from 'react';
import { Article } from '@/types';
import { saveArticle, unsaveArticle } from '@/lib/api';
import {
  timeAgo,
  BookmarkIcon,
  ImagePlaceholder,
  FEED_TYPE_LABELS,
  FEED_TYPE_COLORS,
  getJudgmentDisplayTitle,
  getJudgmentDocLabel,
} from './ArticleCard';

interface ArticleDetailPanelProps {
  article: Article | null;
  onClose: () => void;
}

export default function ArticleDetailPanel({ article, onClose }: ArticleDetailPanelProps) {
  const [saved, setSaved] = useState(article?.is_saved ?? false);
  const [saving, setSaving] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Reset state when article changes
  const [prevId, setPrevId] = useState<number | null>(null);
  if (article && article.id !== prevId) {
    setPrevId(article.id);
    setSaved(article.is_saved);
    setImgError(false);
  }

  if (!article) return null;

  const jm = article.judgment;
  const showPlaceholder = !article.image_url || imgError;

  async function toggleSave() {
    if (!article) return;
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
    <>
      {/* Mobile backdrop */}
      <div className="fixed inset-0 bg-black/30 z-20 lg:hidden" onClick={onClose} />

      <div className="panel-enter fixed top-0 right-0 w-[380px] max-w-[90vw] h-screen overflow-y-auto bg-brand-bg-card border-l border-brand-border z-30 lg:relative lg:top-0 lg:right-auto lg:w-auto lg:max-w-none lg:h-screen lg:sticky lg:top-6 lg:z-auto">
      {/* Top bar */}
      <div className="flex items-center justify-between p-4 border-b border-brand-border">
        <div className="flex items-center gap-2">
          <button
            onClick={toggleSave}
            disabled={saving}
            className={`p-2 rounded-lg transition-colors ${saved ? 'bg-brand-accent/10 text-brand-accent' : 'hover:bg-brand-bg-hover text-brand-muted'}`}
            title={saved ? 'Remove from saved' : 'Save for later'}
          >
            <BookmarkIcon saved={saved} />
          </button>
          <a
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg hover:bg-brand-bg-hover text-brand-muted transition-colors"
            title="Open in new tab"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
          </a>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-brand-bg-hover text-brand-muted transition-colors"
          title="Close panel"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Image */}
      <div className="px-6 pt-5">
        <div className="relative aspect-video rounded-lg overflow-hidden bg-brand-bg mx-auto w-3/4">
          {!showPlaceholder && (
            <img
              src={article.image_url!}
              alt=""
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          )}
          {showPlaceholder && <ImagePlaceholder feedType={article.feed_type} />}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Feed type + jurisdiction + time */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${FEED_TYPE_COLORS[article.feed_type] || 'bg-gray-100 text-gray-700'}`}>
            {(article.feed_type === 'judgment' ? getJudgmentDocLabel(article) : null) || FEED_TYPE_LABELS[article.feed_type] || article.feed_type}
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
        <h2 className="font-heading text-lg font-bold text-brand-body leading-snug">
          {article.feed_type === 'judgment' ? getJudgmentDisplayTitle(article) : article.title}
        </h2>

        {/* Source */}
        {article.source_name && (
          <p className="text-xs text-brand-muted">
            {article.source_name}
          </p>
        )}

        {/* Categories */}
        {article.categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {article.categories.map((cat) => (
              <span
                key={cat.id}
                className="text-xs px-2 py-0.5 rounded bg-brand-accent/10 text-brand-accent font-medium"
              >
                {cat.name}
              </span>
            ))}
          </div>
        )}

        {/* Description */}
        {article.description && (
          <div className="text-sm text-brand-body leading-relaxed line-clamp-[10]">
            {article.description}
          </div>
        )}

        {/* Judgment metadata */}
        {jm && (
          <div className="space-y-3 pt-2 border-t border-brand-border">
            <h4 className="text-xs font-semibold text-brand-muted uppercase tracking-wide">Case Details</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {jm.court && (
                <div>
                  <span className="text-brand-muted">Court:</span>
                  <p className="font-medium text-brand-body">{jm.court}</p>
                </div>
              )}
              {jm.document_type && (
                <div>
                  <span className="text-brand-muted">Type:</span>
                  <p className="font-medium text-brand-body">{jm.document_type}</p>
                </div>
              )}
              {jm.case_number && (
                <div>
                  <span className="text-brand-muted">Case:</span>
                  <p className="font-medium text-brand-body">{jm.case_number}</p>
                </div>
              )}
              {jm.procedure_type && (
                <div>
                  <span className="text-brand-muted">Procedure:</span>
                  <p className="font-medium text-brand-body">{jm.procedure_type}</p>
                </div>
              )}
              {jm.parties && (
                <div className="col-span-2">
                  <span className="text-brand-muted">Parties:</span>
                  <p className="font-medium text-brand-body">{jm.parties}</p>
                </div>
              )}
              {jm.ecli && (
                <div className="col-span-2">
                  <span className="text-brand-muted">ECLI:</span>
                  <p className="font-mono text-[11px] text-brand-body">{jm.ecli}</p>
                </div>
              )}
              {jm.judge_rapporteur && (
                <div>
                  <span className="text-brand-muted">Judge Rapporteur:</span>
                  <p className="font-medium text-brand-body">{jm.judge_rapporteur}</p>
                </div>
              )}
              {jm.advocate_general && (
                <div>
                  <span className="text-brand-muted">Advocate General:</span>
                  <p className="font-medium text-brand-body">{jm.advocate_general}</p>
                </div>
              )}
              {jm.decision_date && (
                <div>
                  <span className="text-brand-muted">Decision Date:</span>
                  <p className="font-medium text-brand-body">{new Date(jm.decision_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
              )}
            </div>
            {jm.ai_summary && (
              <div className="p-3 bg-brand-bg rounded-lg border border-brand-border text-sm text-brand-body leading-relaxed whitespace-pre-line">
                <p className="text-xs font-semibold text-brand-accent mb-1">AI Summary</p>
                {jm.ai_summary}
              </div>
            )}
          </div>
        )}

        {/* Read full article button */}
        <a
          href={article.link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-brand-body text-white text-sm font-medium rounded-lg hover:bg-brand-body/90 transition-colors"
        >
          Read full article
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
        </a>
      </div>
    </div>
    </>
  );
}
