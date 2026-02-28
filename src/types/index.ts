export interface Category {
  id: number;
  name: string;
  slug: string;
  article_count?: number;
}

export interface JudgmentMetadata {
  ecli: string | null;
  court: string | null;
  chamber: string | null;
  judge_rapporteur: string | null;
  procedure_type: string | null;
  subject_matter: string | null;
  document_type: string | null;
  case_name: string | null;
  decision_date: string | null;
  ai_summary: string | null;
}

export interface Article {
  id: number;
  title: string;
  link: string;
  description: string;
  content: string;
  image_url: string | null;
  source_name: string;
  source_url: string;
  published_at: string;
  feed_type: 'news' | 'blogpost' | 'judgment' | 'regulatory';
  jurisdiction: string | null;
  language: string;
  relevance_score: number;
  categories: Category[];
  is_saved: boolean;
  is_read: boolean;
  judgment: JudgmentMetadata | null;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ArticlesResponse {
  articles: Article[];
  pagination: Pagination;
}

export interface CategoriesResponse {
  categories: Category[];
}

export type FeedType = 'all' | 'news' | 'blogpost' | 'judgment' | 'regulatory';

export type ViewMode = 'card' | 'list';
