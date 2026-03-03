'use client';

import { useState, useEffect } from 'react';
import { Article } from '@/types';
import { saveArticle, unsaveArticle, markImportant, unmarkImportant } from '@/lib/api';
import {
  timeAgo,
  BookmarkIcon,
  ImportantIcon,
  ImagePlaceholder,
  FEED_TYPE_LABELS,
  FEED_TYPE_COLORS,
  getJudgmentDisplayTitle,
  getJudgmentDocLabel,
} from './ArticleCard';

interface ArticleDetailPanelProps {
  article: Article | null;
  onClose: () => void;
  onImportantChange?: (articleId: number, isImportant: boolean, importantCount: number) => void;
  onSaveChange?: (articleId: number, isSaved: boolean) => void;
}

export default function ArticleDetailPanel({ article, onClose, onImportantChange, onSaveChange }: ArticleDetailPanelProps) {
  const [saved, setSaved] = useState(article?.is_saved ?? false);
  const [saving, setSaving] = useState(false);
  const [important, setImportant] = useState(article?.is_important ?? false);
  const [importantCount, setImportantCount] = useState(article?.important_count ?? 0);
  const [toggling, setToggling] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Reset state when article changes
  const [prevId, setPrevId] = useState<number | null>(null);
  if (article && article.id !== prevId) {
    setPrevId(article.id);
    setSaved(article.is_saved);
    setImportant(article.is_important);
    setImportantCount(article.important_count);
    setImgError(false);
  }

  // Sync local state from parent prop changes (e.g. when card toggles)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (article) setSaved(article.is_saved); }, [article?.is_saved, article]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (article) setImportant(article.is_important); }, [article?.is_important, article]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (article) setImportantCount(article.important_count); }, [article?.important_count, article]);

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
        onSaveChange?.(article.id, false);
      } else {
        await saveArticle(article.id);
        setSaved(true);
        onSaveChange?.(article.id, true);
      }
    } catch {
      // revert on error
    } finally {
      setSaving(false);
    }
  }

  async function toggleImportant() {
    if (!article) return;
    setToggling(true);
    const wasImportant = important;
    setImportant(!wasImportant);
    setImportantCount(c => wasImportant ? Math.max(0, c - 1) : c + 1);
    try {
      const res = wasImportant
        ? await unmarkImportant(article.id)
        : await markImportant(article.id);
      setImportantCount(res.important_count);
      onImportantChange?.(article.id, !wasImportant, res.important_count);
    } catch {
      setImportant(wasImportant);
      setImportantCount(c => wasImportant ? c + 1 : Math.max(0, c - 1));
    } finally {
      setToggling(false);
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
          <button
            onClick={toggleImportant}
            disabled={toggling}
            className={`p-2 rounded-lg transition-colors flex items-center gap-1 ${important ? 'bg-brand-accent/15 text-brand-accent' : 'hover:bg-brand-bg-hover text-brand-muted'}`}
            title={important ? 'Remove important vote' : 'Mark as important'}
          >
            <ImportantIcon active={important} />
            {importantCount > 0 && (
              <span className="text-xs font-medium">{importantCount}</span>
            )}
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

        {/* Social proof */}
        {importantCount > 0 && (
          <p className="text-xs text-brand-accent font-medium flex items-center gap-1">
            <ImportantIcon active />
            {importantCount} {importantCount === 1 ? 'person' : 'people'} found this important
          </p>
        )}

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

        {/* Description — hide for legislation if description is only metadata (CELEX + creator) */}
        {article.description && !(article.feed_type === 'legislation' && article.description.startsWith('CELEX:')) && (
          <div className="text-sm text-brand-body leading-relaxed line-clamp-[10]">
            {article.description}
          </div>
        )}

        {/* Legislation metadata */}
        {article.feed_type === 'legislation' && (
          <div className="space-y-3 pt-2 border-t border-brand-border">
            <h4 className="text-xs font-semibold text-brand-muted uppercase tracking-wide">Legislation Details</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {article.source_name && (
                <div>
                  <span className="text-brand-muted">Source:</span>
                  <p className="font-medium text-brand-body">{article.source_name}</p>
                </div>
              )}
              {article.jurisdiction && (
                <div>
                  <span className="text-brand-muted">Jurisdiction:</span>
                  <p className="font-medium text-brand-body">{article.jurisdiction}</p>
                </div>
              )}
              {(() => {
                const celexMatch = article.description?.match(/CELEX:\s*([\w()]+)/);
                return celexMatch ? (
                  <div className="col-span-2">
                    <span className="text-brand-muted">CELEX:</span>
                    <p className="font-mono text-[11px] text-brand-body">{celexMatch[1]}</p>
                  </div>
                ) : null;
              })()}
              {(() => {
                // Extract creator: everything after " — " in CELEX descriptions
                const creatorMatch = article.description?.match(/CELEX:\s*[\w()]+\s*—\s*(.+)/);
                return creatorMatch ? (
                  <div className="col-span-2">
                    <span className="text-brand-muted">Author:</span>
                    <p className="font-medium text-brand-body">{creatorMatch[1]}</p>
                  </div>
                ) : null;
              })()}
              {(() => {
                // BGBl metadata: Initiant field
                const initiantMatch = article.description?.match(/Initiant:\s*([^—]+)/);
                return initiantMatch ? (
                  <div className="col-span-2">
                    <span className="text-brand-muted">Initiant:</span>
                    <p className="font-medium text-brand-body">{initiantMatch[1].trim()}</p>
                  </div>
                ) : null;
              })()}
              {(() => {
                // BGBl metadata: Sachgebiet field
                const sachgebietMatch = article.description?.match(/Sachgebiet:\s*([^—]+)/);
                return sachgebietMatch ? (
                  <div className="col-span-2">
                    <span className="text-brand-muted">Subject Area:</span>
                    <p className="font-medium text-brand-body">{sachgebietMatch[1].trim()}</p>
                  </div>
                ) : null;
              })()}
            </div>
            {/* AI Summary for EU legislation */}
            {article.content && !article.content.startsWith('<') && (
              <div className="p-3 bg-brand-bg rounded-lg border border-brand-border text-sm text-brand-body leading-relaxed whitespace-pre-line">
                <p className="text-xs font-semibold text-brand-accent mb-1">AI Summary</p>
                {article.content}
              </div>
            )}
          </div>
        )}

        {/* Procurement metadata */}
        {article.feed_type === 'procurement' && (
          <div className="space-y-3 pt-2 border-t border-brand-border">
            <h4 className="text-xs font-semibold text-brand-muted uppercase tracking-wide">Procurement Details</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {(() => {
                // Title is "modeloAnuncio | designacaoEntidade" — extract both
                const parts = article.title.split(' | ');
                const procedure = parts[0] || null;
                const entity = parts.slice(1).join(' | ') || null;
                return (
                  <>
                    {procedure && (
                      <div>
                        <span className="text-brand-muted">Procedure:</span>
                        <p className="font-medium text-brand-body">{procedure}</p>
                      </div>
                    )}
                    {entity && (
                      <div className="col-span-2">
                        <span className="text-brand-muted">Contracting Entity:</span>
                        <p className="font-medium text-brand-body">{entity}</p>
                      </div>
                    )}
                  </>
                );
              })()}
              {(() => {
                const m = article.content?.match(/Preço Base:\s*([^—]+)/);
                return m ? (
                  <div>
                    <span className="text-brand-muted">Base Price:</span>
                    <p className="font-semibold text-brand-body">{m[1].trim()}</p>
                  </div>
                ) : null;
              })()}
              {(() => {
                const m = article.content?.match(/Tipo de Contrato:\s*([^—]+)/);
                return m ? (
                  <div>
                    <span className="text-brand-muted">Contract Type:</span>
                    <p className="font-medium text-brand-body">{m[1].trim()}</p>
                  </div>
                ) : null;
              })()}
              {(() => {
                const m = article.content?.match(/CPV:\s*([^—]+)/);
                return m ? (
                  <div className="col-span-2">
                    <span className="text-brand-muted">CPV:</span>
                    <p className="font-medium text-brand-body">{m[1].trim()}</p>
                  </div>
                ) : null;
              })()}
              {(() => {
                const m = article.content?.match(/Tipo de Acto:\s*([^—]+)/);
                return m ? (
                  <div>
                    <span className="text-brand-muted">Notice Type:</span>
                    <p className="font-medium text-brand-body">{m[1].trim()}</p>
                  </div>
                ) : null;
              })()}
              {(() => {
                const m = article.content?.match(/Prazo Propostas:\s*([^—]+)/);
                return m ? (
                  <div>
                    <span className="text-brand-muted">Deadline:</span>
                    <p className="font-medium text-brand-body">{m[1].trim()}</p>
                  </div>
                ) : null;
              })()}
              {article.jurisdiction && (
                <div>
                  <span className="text-brand-muted">Jurisdiction:</span>
                  <p className="font-medium text-brand-body">{article.jurisdiction}</p>
                </div>
              )}
            </div>
            {/* Link to tender documents */}
            {article.content?.includes('Peças do Procedimento:') && (() => {
              const m = article.content.match(/Peças do Procedimento:\s*(\S+)/);
              return m ? (
                <a
                  href={m[1]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-brand-accent font-medium hover:underline"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m.75 12 3 3m0 0 3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                  </svg>
                  View tender documents
                </a>
              ) : null;
            })()}
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
