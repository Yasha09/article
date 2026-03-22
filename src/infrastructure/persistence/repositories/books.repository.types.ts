import { Author } from '../entities/author.entity';
import { Book } from '../entities/book.entity';
import { Category } from '../entities/category.entity';
import { User } from '../entities/user.entity';

export interface CreateBookParams {
  title: string;
  summary: string;
  publishedAt: Date;
  coverImagePath: string | null;
  bookFilePath: string | null;
  author: Author;
  createdBy: User;
  categories: Category[];
}

export interface FindBooksParams {
  search?: string;
  authorId?: string;
  category?: string;
  publishedFrom?: Date;
  publishedTo?: Date;
  skip: number;
  take: number;
}

export type PersistedBook = Book;
