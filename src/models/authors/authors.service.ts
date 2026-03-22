import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { LocalFilesService } from '../../common/uploads/local-files.service';
import { Author } from '../../infrastructure/persistence/entities/author.entity';
import { Book } from '../../infrastructure/persistence/entities/book.entity';
import { AuthorsRepository } from '../../infrastructure/persistence/repositories/authors.repository';
import { UsersRepository } from '../../infrastructure/persistence/repositories/users.repository';
import { RedisService } from '../../infrastructure/cache/redis.service';
import { CreateAuthorDto } from './dto/create-author.dto';
import { QueryAuthorsDto } from './dto/query-authors.dto';
import { UpdateAuthorDto } from './dto/update-author.dto';
import {
  AuthorDataResponse,
  AuthorResponse,
  NormalizedAuthorsQuery,
  PaginatedAuthorsResponse,
  RemoveAuthorResponse,
} from './interfaces/authors.interface';

@Injectable()
export class AuthorsService {
  private readonly listCachePrefix = 'authors:list:';
  private readonly byIdCachePrefix = 'authors:byId:';
  private readonly cacheTtlSeconds: number;

  constructor(
    private readonly authorsRepository: AuthorsRepository,
    private readonly usersRepository: UsersRepository,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
    private readonly localFilesService: LocalFilesService,
    @InjectRepository(Book)
    private readonly booksRepository: Repository<Book>,
  ) {
    this.cacheTtlSeconds = this.configService.get<number>(
      'cache.ttlSeconds',
      60,
    );
  }

  async create(
    createAuthorDto: CreateAuthorDto,
    currentUserId: string,
    avatarImagePath: string | null,
  ): Promise<AuthorDataResponse> {
    try {
      const createdBy = await this.usersRepository.findById(currentUserId);
      if (!createdBy) {
        throw new NotFoundException('User not found');
      }

      const author = this.authorsRepository.create({
        name: createAuthorDto.name,
        bio: createAuthorDto.bio ?? null,
        avatarImagePath,
        createdBy,
      });

      const savedAuthor = await this.authorsRepository.save(author);
      const withRelations = await this.authorsRepository.findByIdWithRelations(
        savedAuthor.id,
      );

      if (!withRelations) {
        throw new NotFoundException('Author not found after create');
      }

      await this.invalidateListCaches();

      return { data: this.toAuthorResponse(withRelations) };
    } catch (error) {
      await this.localFilesService.deleteFile(avatarImagePath);
      throw error;
    }
  }

  async findAll(query: QueryAuthorsDto): Promise<PaginatedAuthorsResponse> {
    const normalized = this.normalizeQuery(query);
    const cacheKey = this.buildListCacheKey(normalized);
    const cached =
      await this.redisService.get<PaginatedAuthorsResponse>(cacheKey);

    if (cached) {
      return cached;
    }

    const [authors, total] = await this.authorsRepository.findAndCount({
      search: normalized.search ? `%${normalized.search}%` : undefined,
      skip: (normalized.page - 1) * normalized.limit,
      take: normalized.limit,
    });

    const response: PaginatedAuthorsResponse = {
      data: authors.map((author) => this.toAuthorResponse(author)),
      meta: {
        page: normalized.page,
        limit: normalized.limit,
        total,
      },
    };

    await this.redisService.set(cacheKey, response, this.cacheTtlSeconds);

    return response;
  }

  async findOne(id: string): Promise<AuthorDataResponse> {
    const cacheKey = `${this.byIdCachePrefix}${id}`;
    const cached = await this.redisService.get<AuthorDataResponse>(cacheKey);

    if (cached) {
      return cached;
    }

    const author = await this.authorsRepository.findByIdWithRelations(id);
    if (!author) {
      throw new NotFoundException('Author not found');
    }

    const response: AuthorDataResponse = {
      data: this.toAuthorResponse(author),
    };

    await this.redisService.set(cacheKey, response, this.cacheTtlSeconds);

    return response;
  }

  async update(
    id: string,
    updateAuthorDto: UpdateAuthorDto,
    currentUserId: string,
    avatarImagePath: string | null,
  ): Promise<AuthorDataResponse> {
    const author = await this.authorsRepository.findByIdWithRelations(id);
    if (!author) {
      throw new NotFoundException('Author not found');
    }

    this.assertOwnership(author, currentUserId);

    const previousAvatarPath = author.avatarImagePath;

    try {
      if (updateAuthorDto.name !== undefined) {
        author.name = updateAuthorDto.name;
      }

      if (updateAuthorDto.bio !== undefined) {
        author.bio = updateAuthorDto.bio;
      }

      if (avatarImagePath) {
        author.avatarImagePath = avatarImagePath;
      }

      const saved = await this.authorsRepository.save(author);

      if (avatarImagePath && previousAvatarPath && previousAvatarPath !== avatarImagePath) {
        await this.localFilesService.deleteFile(previousAvatarPath);
      }

      await this.invalidateAuthorCaches(saved.id);

      return { data: this.toAuthorResponse(saved) };
    } catch (error) {
      if (avatarImagePath) {
        await this.localFilesService.deleteFile(avatarImagePath);
      }

      throw error;
    }
  }

  async remove(
    id: string,
    currentUserId: string,
  ): Promise<RemoveAuthorResponse> {
    const author = await this.authorsRepository.findByIdWithRelations(id);
    if (!author) {
      throw new NotFoundException('Author not found');
    }

    this.assertOwnership(author, currentUserId);

    const bookCount = await this.booksRepository.count({
      where: { author: { id } },
    });
    if (bookCount > 0) {
      throw new ConflictException(
        'Author cannot be deleted while books reference it',
      );
    }

    await this.authorsRepository.remove(author);
    await this.invalidateAuthorCaches(id);
    await this.localFilesService.deleteFile(author.avatarImagePath);

    return { data: { id } };
  }

  async getAuthorOrFail(id: string): Promise<Author> {
    const author = await this.authorsRepository.findByIdWithRelations(id);
    if (!author) {
      throw new NotFoundException('Author not found');
    }

    return author;
  }

  private toAuthorResponse(author: Author): AuthorResponse {
    return {
      id: author.id,
      name: author.name,
      bio: author.bio,
      avatarImagePath: author.avatarImagePath,
      avatarImageUrl: this.localFilesService.buildPublicUrl(
        author.avatarImagePath,
      ),
      createdAt: author.createdAt,
      updatedAt: author.updatedAt,
      createdBy: {
        id: author.createdBy.id,
        email: author.createdBy.email,
        createdAt: author.createdBy.createdAt,
        updatedAt: author.createdBy.updatedAt,
      },
    };
  }

  private assertOwnership(author: Author, currentUserId: string): void {
    if (author.createdBy.id !== currentUserId) {
      throw new ForbiddenException('You are not allowed to modify this author');
    }
  }

  private normalizeQuery(query: QueryAuthorsDto): NormalizedAuthorsQuery {
    return {
      page: query.page ?? 1,
      limit: Math.min(query.limit ?? 10, 50),
      search: query.search?.trim() || undefined,
    };
  }

  private buildListCacheKey(normalizedQuery: NormalizedAuthorsQuery): string {
    const hash = createHash('sha1')
      .update(JSON.stringify(normalizedQuery))
      .digest('hex');

    return `${this.listCachePrefix}${hash}`;
  }

  private async invalidateListCaches(): Promise<void> {
    await this.redisService.delByPrefix(this.listCachePrefix);
  }

  private async invalidateAuthorCaches(authorId: string): Promise<void> {
    await Promise.all([
      this.redisService.del(`${this.byIdCachePrefix}${authorId}`),
      this.invalidateListCaches(),
      this.redisService.delByPrefix('books:list:'),
      this.redisService.delByPrefix('books:byId:'),
    ]);
  }
}
