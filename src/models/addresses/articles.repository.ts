import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Article } from './entities/article.entity';

@Injectable()
export class ArticlesRepository {
  constructor(
    @InjectRepository(Article)
    private readonly repository: Repository<Article>,
  ) {}

  create(params: {
    title: string;
    description: string;
    publishedAt: Date;
    author: User;
  }): Article {
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

  async findAndCount(params: {
    where: FindOptionsWhere<Article>;
    skip: number;
    take: number;
  }): Promise<[Article[], number]> {
    return this.repository.findAndCount({
      where: params.where,
      relations: { author: true },
      skip: params.skip,
      take: params.take,
      order: { publishedAt: 'DESC' },
    });
  }
}
