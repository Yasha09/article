import { ConfigService } from '@nestjs/config';
import { ForbiddenException } from '@nestjs/common';
import { FindOptionsWhere } from 'typeorm';
import { RedisService } from '../../infrastructure/cache/redis.service';
import { UsersRepository } from '../../infrastructure/persistence/repositories/users.repository';
import { User } from '../../infrastructure/persistence/entities/user.entity';
import { Article } from '../../infrastructure/persistence/entities/article.entity';
import { ArticlesRepository } from '../../infrastructure/persistence/repositories/articles.repository';
import { ArticlesService } from './articles.service';

describe('ArticlesService', () => {
  let service: ArticlesService;

  const articlesRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findByIdWithAuthor: jest.fn(),
    findAndCount: jest.fn(),
    remove: jest.fn(),
  };

  const usersRepository = {
    findById: jest.fn(),
  };

  const redisService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    delByPrefix: jest.fn(),
  };

  const configService = {
    get: jest.fn().mockReturnValue(60),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ArticlesService(
      articlesRepository as unknown as ArticlesRepository,
      usersRepository as unknown as UsersRepository,
      redisService as unknown as RedisService,
      configService as unknown as ConfigService,
    );
  });

  it('create sets authenticated user as author', async () => {
    const author = {
      id: 'author-id',
      email: 'author@example.com',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    } as User;

    const createdArticle = {
      id: 'article-id',
      title: 'Title',
      description: 'Valid description content',
      publishedAt: new Date('2026-02-12T10:00:00.000Z'),
      author,
      createdAt: new Date('2026-02-12T10:00:00.000Z'),
      updatedAt: new Date('2026-02-12T10:00:00.000Z'),
    } as Article;

    usersRepository.findById = jest.fn().mockResolvedValue(author);
    articlesRepository.create = jest.fn().mockReturnValue(createdArticle);
    articlesRepository.save = jest.fn().mockResolvedValue(createdArticle);
    articlesRepository.findByIdWithAuthor = jest
      .fn()
      .mockResolvedValue(createdArticle);
    redisService.delByPrefix = jest.fn().mockResolvedValue(undefined);
    const createMock = articlesRepository.create;

    await service.create(
      {
        title: 'Title',
        description: 'Valid description content',
        publishedAt: '2026-02-12T10:00:00.000Z',
      },
      'author-id',
    );

    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({ author }),
    );
  });

  it('update throws ForbiddenException when user is not owner', async () => {
    articlesRepository.findByIdWithAuthor = jest.fn().mockResolvedValue({
      id: 'article-id',
      author: { id: 'owner-id' },
    });

    await expect(
      service.update('article-id', { title: 'New title' }, 'different-user-id'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('remove throws ForbiddenException when user is not owner', async () => {
    articlesRepository.findByIdWithAuthor = jest.fn().mockResolvedValue({
      id: 'article-id',
      author: { id: 'owner-id' },
    });

    await expect(
      service.remove('article-id', 'different-user-id'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('findAll applies pagination and filters in repository query', async () => {
    redisService.get = jest.fn().mockResolvedValue(null);
    let cacheKey = '';
    redisService.set = jest.fn().mockImplementation((key: string) => {
      cacheKey = key;
      return Promise.resolve();
    });

    const author = {
      id: 'author-id',
      email: 'author@example.com',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    } as User;

    let findCallArgs:
      | {
          where: FindOptionsWhere<Article>;
          skip: number;
          take: number;
        }
      | undefined;
    articlesRepository.findAndCount = jest
      .fn()
      .mockImplementation(
        (params: {
          where: FindOptionsWhere<Article>;
          skip: number;
          take: number;
        }) => {
          findCallArgs = params;
          return Promise.resolve([
            [
              {
                id: 'article-id',
                title: 'Title',
                description: 'Valid description content',
                publishedAt: new Date('2026-02-12T10:00:00.000Z'),
                author,
                createdAt: new Date('2026-02-12T10:00:00.000Z'),
                updatedAt: new Date('2026-02-12T10:00:00.000Z'),
              },
            ],
            1,
          ]);
        },
      );

    await service.findAll({
      page: 2,
      limit: 20,
      authorId: 'author-id',
      publishedFrom: '2026-01-01T00:00:00.000Z',
      publishedTo: '2026-12-31T23:59:59.999Z',
    });

    expect(findCallArgs).toBeDefined();
    if (!findCallArgs) {
      throw new Error('Expected repository findAndCount call args');
    }

    expect(findCallArgs.skip).toBe(20);
    expect(findCallArgs.take).toBe(20);
    expect(findCallArgs.where.author).toEqual({ id: 'author-id' });
    expect(findCallArgs.where.publishedAt).toBeDefined();

    expect(cacheKey.startsWith('articles:list:')).toBe(true);
  });
});
