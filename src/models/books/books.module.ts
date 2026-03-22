import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UploadsModule } from '../../common/uploads/uploads.module';
import { Book } from '../../infrastructure/persistence/entities/book.entity';
import { Category } from '../../infrastructure/persistence/entities/category.entity';
import { BooksRepository } from '../../infrastructure/persistence/repositories/books.repository';
import { AuthorsModule } from '../authors/authors.module';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { BooksController } from './books.controller';
import { BooksService } from './books.service';
import { BookOwnerGuard } from './guards/book-owner.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Book, Category]),
    AuthModule,
    UsersModule,
    AuthorsModule,
    UploadsModule,
  ],
  controllers: [BooksController],
  providers: [BooksRepository, BooksService, JwtAuthGuard, BookOwnerGuard],
  exports: [BooksRepository, BooksService],
})
export class BooksModule {}
