import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Article } from '../entities/article.entity';
import {
  CreateArticleParams,
  FindAndCountArticlesParams,
} from './articles.repository.types';

@Injectable()
export class ArticlesRepository {
  constructor(
    @InjectRepository(Article)
    private readonly repository: Repository<Article>,
  ) {}

  create(params: CreateArticleParams): Article {
    return this.repository.create(params);
  }

  async save(article: Article): Promise<Article> {
    return this.repository.save(article);
  }

  async remove(article: Article): Promise<Article> {
    return this.repository.remove(article);
  }

  async findByIdWithAuthor(id: string): Promise<Article | null> {
    return this.repository.findOne({
      where: { id },
      relations: { author: true },
    });
  }

  async findAndCount(
    params: FindAndCountArticlesParams,
  ): Promise<[Article[], number]> {
    return this.repository.findAndCount({
      where: params.where,
      relations: { author: true },
      skip: params.skip,
      take: params.take,
      order: { publishedAt: 'DESC' },
    });
  }
}
