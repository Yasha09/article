import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import {
  Between,
  FindOptionsWhere,
  LessThanOrEqual,
  MoreThanOrEqual,
} from 'typeorm';
import { RedisService } from '../../providers/cache/redis/redis.service';
import { Article } from './entities/article.entity';
import { ArticlesRepository } from './articles.repository';
import { CreateArticleDto } from './dto/create-article.dto';
import { QueryArticlesDto } from './dto/query-articles.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { UsersRepository } from '../users/users.repository';

export interface ArticleResponse {
  id: string;
  title: string;
  description: string;
  publishedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: string;
    email: string;
    createdAt: Date;
    updatedAt: Date;
  };
}

export interface PaginatedArticlesResponse {
  data: ArticleResponse[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
}

@Injectable()
export class ArticlesService {
  private readonly listCachePrefix = 'articles:list:';
  private readonly byIdCachePrefix = 'articles:byId:';
  private readonly cacheTtlSeconds: number;

  constructor(
    private readonly articlesRepository: ArticlesRepository,
    private readonly usersRepository: UsersRepository,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {
    this.cacheTtlSeconds = this.configService.get<number>(
      'cache.ttlSeconds',
      60,
    );
  }

  async create(
    createArticleDto: CreateArticleDto,
    authorId: string,
  ): Promise<{ data: ArticleResponse }> {
    const author = await this.usersRepository.findById(authorId);
    if (!author) {
      throw new NotFoundException('Author not found');
    }

    const article = this.articlesRepository.create({
      title: createArticleDto.title,
      description: createArticleDto.description,
      publishedAt: new Date(createArticleDto.publishedAt),
      author,
    });

    const savedArticle = await this.articlesRepository.save(article);
    const withAuthor = await this.articlesRepository.findByIdWithAuthor(
      savedArticle.id,
    );

    if (!withAuthor) {
      throw new NotFoundException('Article not found after create');
    }

    await this.invalidateListCaches();

    return { data: this.toArticleResponse(withAuthor) };
  }

  async findAll(query: QueryArticlesDto): Promise<PaginatedArticlesResponse> {
    const normalized = this.normalizeQuery(query);
    const cacheKey = this.buildListCacheKey(normalized);
    const cached =
      await this.redisService.get<PaginatedArticlesResponse>(cacheKey);

    if (cached) {
      return cached;
    }

    const where: FindOptionsWhere<Article> = {};

    if (normalized.authorId) {
      where.author = { id: normalized.authorId };
    }

    if (normalized.publishedFrom && normalized.publishedTo) {
      where.publishedAt = Between(
        normalized.publishedFrom,
        normalized.publishedTo,
      );
    } else if (normalized.publishedFrom) {
      where.publishedAt = MoreThanOrEqual(normalized.publishedFrom);
    } else if (normalized.publishedTo) {
      where.publishedAt = LessThanOrEqual(normalized.publishedTo);
    }

    const [articles, total] = await this.articlesRepository.findAndCount({
      where,
      skip: (normalized.page - 1) * normalized.limit,
      take: normalized.limit,
    });

    const response: PaginatedArticlesResponse = {
      data: articles.map((article) => this.toArticleResponse(article)),
      meta: {
        page: normalized.page,
        limit: normalized.limit,
        total,
      },
    };

    await this.redisService.set(cacheKey, response, this.cacheTtlSeconds);

    return response;
  }

  async findOne(id: string): Promise<{ data: ArticleResponse }> {
    const cacheKey = `${this.byIdCachePrefix}${id}`;
    const cached = await this.redisService.get<{ data: ArticleResponse }>(
      cacheKey,
    );

    if (cached) {
      return cached;
    }

    const article = await this.articlesRepository.findByIdWithAuthor(id);

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    const response = { data: this.toArticleResponse(article) };
    await this.redisService.set(cacheKey, response, this.cacheTtlSeconds);

    return response;
  }

  async update(
    id: string,
    updateArticleDto: UpdateArticleDto,
    currentUserId: string,
  ): Promise<{ data: ArticleResponse }> {
    const article = await this.articlesRepository.findByIdWithAuthor(id);

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    this.assertOwnership(article, currentUserId);

    if (updateArticleDto.title !== undefined) {
      article.title = updateArticleDto.title;
    }

    if (updateArticleDto.description !== undefined) {
      article.description = updateArticleDto.description;
    }

    if (updateArticleDto.publishedAt !== undefined) {
      article.publishedAt = new Date(updateArticleDto.publishedAt);
    }

    const saved = await this.articlesRepository.save(article);

    await this.invalidateArticleCaches(saved.id);

    return { data: this.toArticleResponse(saved) };
  }

  async remove(
    id: string,
    currentUserId: string,
  ): Promise<{ data: { id: string } }> {
    const article = await this.articlesRepository.findByIdWithAuthor(id);

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    this.assertOwnership(article, currentUserId);

    await this.articlesRepository.remove(article);

    await this.invalidateArticleCaches(id);

    return { data: { id } };
  }

  async getArticleOrFail(id: string): Promise<Article> {
    const article = await this.articlesRepository.findByIdWithAuthor(id);

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    return article;
  }

  private toArticleResponse(article: Article): ArticleResponse {
    return {
      id: article.id,
      title: article.title,
      description: article.description,
      publishedAt: article.publishedAt,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
      author: {
        id: article.author.id,
        email: article.author.email,
        createdAt: article.author.createdAt,
        updatedAt: article.author.updatedAt,
      },
    };
  }

  private assertOwnership(article: Article, currentUserId: string): void {
    if (article.author.id !== currentUserId) {
      throw new ForbiddenException(
        'You are not allowed to modify this article',
      );
    }
  }

  private normalizeQuery(query: QueryArticlesDto): {
    page: number;
    limit: number;
    authorId?: string;
    publishedFrom?: Date;
    publishedTo?: Date;
  } {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 10, 50);

    return {
      page,
      limit,
      authorId: query.authorId,
      publishedFrom: query.publishedFrom
        ? new Date(query.publishedFrom)
        : undefined,
      publishedTo: query.publishedTo ? new Date(query.publishedTo) : undefined,
    };
  }

  private buildListCacheKey(normalizedQuery: {
    page: number;
    limit: number;
    authorId?: string;
    publishedFrom?: Date;
    publishedTo?: Date;
  }): string {
    const serialized = JSON.stringify({
      ...normalizedQuery,
      publishedFrom: normalizedQuery.publishedFrom?.toISOString(),
      publishedTo: normalizedQuery.publishedTo?.toISOString(),
    });

    const hash = createHash('sha1').update(serialized).digest('hex');
    return `${this.listCachePrefix}${hash}`;
  }

  private async invalidateListCaches(): Promise<void> {
    await this.redisService.delByPrefix(this.listCachePrefix);
  }

  private async invalidateArticleCaches(articleId: string): Promise<void> {
    await Promise.all([
      this.redisService.del(`${this.byIdCachePrefix}${articleId}`),
      this.invalidateListCaches(),
    ]);
  }
}
