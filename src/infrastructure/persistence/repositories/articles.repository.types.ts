import { FindOptionsWhere } from 'typeorm';
import { Article } from '../entities/article.entity';
import { User } from '../entities/user.entity';

export interface CreateArticleParams {
  title: string;
  description: string;
  publishedAt: Date;
  author: User;
}

export interface FindAndCountArticlesParams {
  where: FindOptionsWhere<Article>;
  skip: number;
  take: number;
}
