export interface ArticleAuthorResponse {
  id: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ArticleResponse {
  id: string;
  title: string;
  description: string;
  publishedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  author: ArticleAuthorResponse;
}

export interface ArticlesMetaResponse {
  page: number;
  limit: number;
  total: number;
}

export interface PaginatedArticlesResponse {
  data: ArticleResponse[];
  meta: ArticlesMetaResponse;
}

export interface ArticleDataResponse {
  data: ArticleResponse;
}

export interface RemoveArticleData {
  id: string;
}

export interface RemoveArticleResponse {
  data: RemoveArticleData;
}

export interface NormalizedArticlesQuery {
  page: number;
  limit: number;
  authorId?: string;
  publishedFrom?: Date;
  publishedTo?: Date;
}
