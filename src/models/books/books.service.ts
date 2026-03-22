import {
  InternalServerErrorException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash } from 'crypto';
import { extname } from 'path';
import { In, Repository } from 'typeorm';
import { LocalFilesService } from '../../common/uploads/local-files.service';
import { RedisService } from '../../infrastructure/cache/redis.service';
import { Book } from '../../infrastructure/persistence/entities/book.entity';
import { Category } from '../../infrastructure/persistence/entities/category.entity';
import { AuthorsRepository } from '../../infrastructure/persistence/repositories/authors.repository';
import { BooksRepository } from '../../infrastructure/persistence/repositories/books.repository';
import { UsersRepository } from '../../infrastructure/persistence/repositories/users.repository';
import { CreateBookDto } from './dto/create-book.dto';
import { QueryBooksDto } from './dto/query-books.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import {
  BookDataResponse,
  BookResponse,
  NormalizedBooksQuery,
  PaginatedBooksResponse,
  RemoveBookResponse,
} from './interfaces/books.interface';

@Injectable()
export class BooksService {
  private readonly listCachePrefix = 'books:list:';
  private readonly byIdCachePrefix = 'books:byId:';
  private readonly cacheTtlSeconds: number;

  constructor(
    private readonly booksRepository: BooksRepository,
    private readonly authorsRepository: AuthorsRepository,
    private readonly usersRepository: UsersRepository,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
    private readonly localFilesService: LocalFilesService,
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
  ) {
    this.cacheTtlSeconds = this.configService.get<number>(
      'cache.ttlSeconds',
      60,
    );
  }

  async create(
    createBookDto: CreateBookDto,
    currentUserId: string,
    coverImagePath: string | null,
    bookFilePath: string | null,
  ): Promise<BookDataResponse> {
    try {
      const [createdBy, author] = await Promise.all([
        this.usersRepository.findById(currentUserId),
        this.authorsRepository.findByIdWithRelations(createBookDto.authorId),
      ]);

      if (!createdBy) {
        throw new NotFoundException('User not found');
      }

      if (!author) {
        throw new NotFoundException('Author not found');
      }

      const categories = await this.resolveCategories(createBookDto.categories);

      const book = this.booksRepository.create({
        title: createBookDto.title,
        summary: createBookDto.summary,
        publishedAt: new Date(createBookDto.publishedAt),
        coverImagePath,
        bookFilePath,
        author,
        createdBy,
        categories,
      });

      const savedBook = await this.booksRepository.save(book);
      const withRelations = await this.booksRepository.findByIdWithRelations(
        savedBook.id,
      );

      if (!withRelations) {
        throw new NotFoundException('Book not found after create');
      }

      await this.invalidateListCaches();

      return { data: this.toBookResponse(withRelations) };
    } catch (error) {
      await Promise.all([
        this.localFilesService.deleteFile(coverImagePath),
        this.localFilesService.deleteFile(bookFilePath),
      ]);
      throw error;
    }
  }

  async findAll(query: QueryBooksDto): Promise<PaginatedBooksResponse> {
    const normalized = this.normalizeQuery(query);
    const cacheKey = this.buildListCacheKey(normalized);
    const cached = await this.redisService.get<PaginatedBooksResponse>(cacheKey);

    if (cached) {
      return cached;
    }

    const [books, total] = await this.booksRepository.findAndCount({
      search: normalized.search ? `%${normalized.search}%` : undefined,
      authorId: normalized.authorId,
      category: normalized.category ? `%${normalized.category}%` : undefined,
      publishedFrom: normalized.publishedFrom,
      publishedTo: normalized.publishedTo,
      skip: (normalized.page - 1) * normalized.limit,
      take: normalized.limit,
    });

    const response: PaginatedBooksResponse = {
      data: books.map((book) => this.toBookResponse(book)),
      meta: {
        page: normalized.page,
        limit: normalized.limit,
        total,
      },
    };

    await this.redisService.set(cacheKey, response, this.cacheTtlSeconds);

    return response;
  }

  async findOne(id: string): Promise<BookDataResponse> {
    const cacheKey = `${this.byIdCachePrefix}${id}`;
    const cached = await this.redisService.get<BookDataResponse>(cacheKey);

    if (cached) {
      return cached;
    }

    const book = await this.booksRepository.findByIdWithRelations(id);
    if (!book) {
      throw new NotFoundException('Book not found');
    }

    const response: BookDataResponse = {
      data: this.toBookResponse(book),
    };

    await this.redisService.set(cacheKey, response, this.cacheTtlSeconds);

    return response;
  }

  async update(
    id: string,
    updateBookDto: UpdateBookDto,
    currentUserId: string,
    coverImagePath: string | null,
    bookFilePath: string | null,
  ): Promise<BookDataResponse> {
    const book = await this.booksRepository.findByIdWithRelations(id);
    if (!book) {
      throw new NotFoundException('Book not found');
    }

    this.assertOwnership(book, currentUserId);

    const previousCoverPath = book.coverImagePath;
    const previousBookFilePath = book.bookFilePath;

    try {
      if (updateBookDto.authorId !== undefined) {
        const author = await this.authorsRepository.findByIdWithRelations(
          updateBookDto.authorId,
        );
        if (!author) {
          throw new NotFoundException('Author not found');
        }

        book.author = author;
      }

      if (updateBookDto.categories !== undefined) {
        book.categories = await this.resolveCategories(updateBookDto.categories);
      }

      if (updateBookDto.title !== undefined) {
        book.title = updateBookDto.title;
      }

      if (updateBookDto.summary !== undefined) {
        book.summary = updateBookDto.summary;
      }

      if (updateBookDto.publishedAt !== undefined) {
        book.publishedAt = new Date(updateBookDto.publishedAt);
      }

      if (coverImagePath) {
        book.coverImagePath = coverImagePath;
      }

      if (bookFilePath) {
        book.bookFilePath = bookFilePath;
      }

      const saved = await this.booksRepository.save(book);

      if (coverImagePath && previousCoverPath && previousCoverPath !== coverImagePath) {
        await this.localFilesService.deleteFile(previousCoverPath);
      }

      if (
        bookFilePath &&
        previousBookFilePath &&
        previousBookFilePath !== bookFilePath
      ) {
        await this.localFilesService.deleteFile(previousBookFilePath);
      }

      await this.invalidateBookCaches(saved.id);

      return { data: this.toBookResponse(saved) };
    } catch (error) {
      await Promise.all([
        this.localFilesService.deleteFile(coverImagePath),
        this.localFilesService.deleteFile(bookFilePath),
      ]);

      throw error;
    }
  }

  async remove(id: string, currentUserId: string): Promise<RemoveBookResponse> {
    const book = await this.booksRepository.findByIdWithRelations(id);
    if (!book) {
      throw new NotFoundException('Book not found');
    }

    this.assertOwnership(book, currentUserId);

    await this.booksRepository.remove(book);
    await this.invalidateBookCaches(id);
    await Promise.all([
      this.localFilesService.deleteFile(book.coverImagePath),
      this.localFilesService.deleteFile(book.bookFilePath),
    ]);

    return { data: { id } };
  }

  async getDownloadInfo(id: string): Promise<{
    absolutePath: string;
    downloadName: string;
  }> {
    const book = await this.getBookOrFail(id);
    if (!book.bookFilePath) {
      throw new NotFoundException('Book file not found');
    }

    try {
      const absolutePath = await this.localFilesService.ensureFileExists(
        book.bookFilePath,
      );
      const extension = extname(book.bookFilePath) || '.pdf';
      const safeTitle = book.title.replace(/[^a-zA-Z0-9-_]+/g, '_');

      return {
        absolutePath,
        downloadName: `${safeTitle}${extension}`,
      };
    } catch {
      throw new InternalServerErrorException('Stored book file is missing');
    }
  }

  async getBookOrFail(id: string): Promise<Book> {
    const book = await this.booksRepository.findByIdWithRelations(id);
    if (!book) {
      throw new NotFoundException('Book not found');
    }

    return book;
  }

  private toBookResponse(book: Book): BookResponse {
    return {
      id: book.id,
      title: book.title,
      summary: book.summary,
      publishedAt: book.publishedAt,
      coverImagePath: book.coverImagePath,
      coverImageUrl: this.localFilesService.buildPublicUrl(book.coverImagePath),
      bookFilePath: book.bookFilePath,
      bookFileUrl: this.localFilesService.buildPublicUrl(book.bookFilePath),
      createdAt: book.createdAt,
      updatedAt: book.updatedAt,
      author: {
        id: book.author.id,
        name: book.author.name,
        bio: book.author.bio,
        avatarImagePath: book.author.avatarImagePath,
        avatarImageUrl: this.localFilesService.buildPublicUrl(
          book.author.avatarImagePath,
        ),
        createdAt: book.author.createdAt,
        updatedAt: book.author.updatedAt,
      },
      createdBy: {
        id: book.createdBy.id,
        email: book.createdBy.email,
        createdAt: book.createdBy.createdAt,
        updatedAt: book.createdBy.updatedAt,
      },
      categories: book.categories.map((category) => ({
        id: category.id,
        name: category.name,
      })),
    };
  }

  private assertOwnership(book: Book, currentUserId: string): void {
    if (book.createdBy.id !== currentUserId) {
      throw new ForbiddenException('You are not allowed to modify this book');
    }
  }

  private normalizeQuery(query: QueryBooksDto): NormalizedBooksQuery {
    return {
      page: query.page ?? 1,
      limit: Math.min(query.limit ?? 10, 50),
      search: query.search?.trim() || undefined,
      authorId: query.authorId,
      category: query.category?.trim() || undefined,
      publishedFrom: query.publishedFrom
        ? new Date(query.publishedFrom)
        : undefined,
      publishedTo: query.publishedTo ? new Date(query.publishedTo) : undefined,
    };
  }

  private buildListCacheKey(normalizedQuery: NormalizedBooksQuery): string {
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

  private async invalidateBookCaches(bookId: string): Promise<void> {
    await Promise.all([
      this.redisService.del(`${this.byIdCachePrefix}${bookId}`),
      this.invalidateListCaches(),
    ]);
  }

  private async resolveCategories(names?: string[]): Promise<Category[]> {
    const normalizedNames = Array.from(
      new Set(
        (names ?? [])
          .map((name) => name.trim().toLowerCase())
          .filter(Boolean),
      ),
    ).slice(0, 20);

    if (normalizedNames.length === 0) {
      return [];
    }

    await this.categoriesRepository.upsert(
      normalizedNames.map((name) => ({ name })),
      ['name'],
    );

    return this.categoriesRepository.find({
      where: { name: In(normalizedNames) },
      order: { name: 'ASC' },
    });
  }
}
