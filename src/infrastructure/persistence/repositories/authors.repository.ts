import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { Author } from '../entities/author.entity';
import {
  CreateAuthorParams,
  FindAuthorsParams,
} from './authors.repository.types';

@Injectable()
export class AuthorsRepository {
  constructor(
    @InjectRepository(Author)
    private readonly repository: Repository<Author>,
  ) {}

  create(params: CreateAuthorParams): Author {
    return this.repository.create(params);
  }

  async save(author: Author): Promise<Author> {
    return this.repository.save(author);
  }

  async remove(author: Author): Promise<Author> {
    return this.repository.remove(author);
  }

  async findByIdWithRelations(id: string): Promise<Author | null> {
    return this.repository.findOne({
      where: { id },
      relations: { createdBy: true },
    });
  }

  async findAndCount(params: FindAuthorsParams): Promise<[Author[], number]> {
    const queryBuilder = this.repository
      .createQueryBuilder('author')
      .leftJoinAndSelect('author.createdBy', 'createdBy')
      .orderBy('author.createdAt', 'DESC')
      .addOrderBy('author.name', 'ASC')
      .skip(params.skip)
      .take(params.take);

    if (params.search) {
      queryBuilder.andWhere(
        new Brackets((builder) => {
          builder
            .where('author.name ILIKE :search', { search: params.search })
            .orWhere('COALESCE(author.bio, \'\') ILIKE :search', {
              search: params.search,
            });
        }),
      );
    }

    return queryBuilder.getManyAndCount();
  }
}
