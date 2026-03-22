export interface BookAuthorResponse {
  id: string;
  name: string;
  bio: string | null;
  avatarImagePath: string | null;
  avatarImageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface BookCreatedByResponse {
  id: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BookCategoryResponse {
  id: string;
  name: string;
}

export interface BookResponse {
  id: string;
  title: string;
  summary: string;
  publishedAt: Date;
  coverImagePath: string | null;
  coverImageUrl: string | null;
  bookFilePath: string | null;
  bookFileUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  author: BookAuthorResponse;
  createdBy: BookCreatedByResponse;
  categories: BookCategoryResponse[];
}

export interface BooksMetaResponse {
  page: number;
  limit: number;
  total: number;
}

export interface PaginatedBooksResponse {
  data: BookResponse[];
  meta: BooksMetaResponse;
}

export interface BookDataResponse {
  data: BookResponse;
}

export interface RemoveBookResponse {
  data: {
    id: string;
  };
}

export interface NormalizedBooksQuery {
  page: number;
  limit: number;
  search?: string;
  authorId?: string;
  category?: string;
  publishedFrom?: Date;
  publishedTo?: Date;
}
