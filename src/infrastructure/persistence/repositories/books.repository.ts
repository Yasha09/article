import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { Book } from '../entities/book.entity';
import { CreateBookParams, FindBooksParams } from './books.repository.types';

@Injectable()
export class BooksRepository {
  constructor(
    @InjectRepository(Book)
    private readonly repository: Repository<Book>,
  ) {}

  create(params: CreateBookParams): Book {
    return this.repository.create(params);
  }

  async save(book: Book): Promise<Book> {
    return this.repository.save(book);
  }

  async remove(book: Book): Promise<Book> {
    return this.repository.remove(book);
  }

  async countByAuthorId(authorId: string): Promise<number> {
    return this.repository.count({ where: { author: { id: authorId } } });
  }

  async findByIdWithRelations(id: string): Promise<Book | null> {
    return this.repository.findOne({
      where: { id },
      relations: { author: { createdBy: true }, createdBy: true, categories: true },
    });
  }

  async findAndCount(params: FindBooksParams): Promise<[Book[], number]> {
    const queryBuilder = this.repository
      .createQueryBuilder('book')
      .distinct(true)
      .leftJoinAndSelect('book.author', 'author')
      .leftJoinAndSelect('author.createdBy', 'authorCreatedBy')
      .leftJoinAndSelect('book.createdBy', 'createdBy')
      .leftJoinAndSelect('book.categories', 'category')
      .orderBy('book.publishedAt', 'DESC')
      .addOrderBy('book.createdAt', 'DESC')
      .skip(params.skip)
      .take(params.take);

    if (params.authorId) {
      queryBuilder.andWhere('author.id = :authorId', {
        authorId: params.authorId,
      });
    }

    if (params.publishedFrom) {
      queryBuilder.andWhere('book.publishedAt >= :publishedFrom', {
        publishedFrom: params.publishedFrom,
      });
    }

    if (params.publishedTo) {
      queryBuilder.andWhere('book.publishedAt <= :publishedTo', {
        publishedTo: params.publishedTo,
      });
    }

    if (params.search) {
      queryBuilder.andWhere(
        new Brackets((builder) => {
          builder
            .where('book.title ILIKE :search', { search: params.search })
            .orWhere('book.summary ILIKE :search', { search: params.search })
            .orWhere('author.name ILIKE :search', { search: params.search })
            .orWhere('category.name ILIKE :search', { search: params.search });
        }),
      );
    }

    if (params.category) {
      queryBuilder.andWhere('category.name ILIKE :category', {
        category: params.category,
      });
    }

    return queryBuilder.getManyAndCount();
  }
}
