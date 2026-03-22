import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UploadsModule } from '../../common/uploads/uploads.module';
import { Author } from '../../infrastructure/persistence/entities/author.entity';
import { Book } from '../../infrastructure/persistence/entities/book.entity';
import { AuthorsRepository } from '../../infrastructure/persistence/repositories/authors.repository';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { AuthorsController } from './authors.controller';
import { AuthorsService } from './authors.service';
import { AuthorOwnerGuard } from './guards/author-owner.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Author, Book]),
    AuthModule,
    UsersModule,
    UploadsModule,
  ],
  controllers: [AuthorsController],
  providers: [
    AuthorsRepository,
    AuthorsService,
    JwtAuthGuard,
    AuthorOwnerGuard,
  ],
  exports: [AuthorsRepository, AuthorsService],
})
export class AuthorsModule {}
