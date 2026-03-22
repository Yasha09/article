export interface AuthorCreatedByResponse {
  id: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthorResponse {
  id: string;
  name: string;
  bio: string | null;
  avatarImagePath: string | null;
  avatarImageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: AuthorCreatedByResponse;
}

export interface AuthorsMetaResponse {
  page: number;
  limit: number;
  total: number;
}

export interface PaginatedAuthorsResponse {
  data: AuthorResponse[];
  meta: AuthorsMetaResponse;
}

export interface AuthorDataResponse {
  data: AuthorResponse;
}

export interface RemoveAuthorResponse {
  data: {
    id: string;
  };
}

export interface NormalizedAuthorsQuery {
  page: number;
  limit: number;
  search?: string;
}
