import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UsersModule } from '../users/users.module';
import { Article } from '../../infrastructure/persistence/entities/article.entity';
import { ArticlesController } from './articles.controller';
import { ArticlesRepository } from '../../infrastructure/persistence/repositories/articles.repository';
import { ArticlesService } from './articles.service';
import { ArticleOwnerGuard } from './guards/article-owner.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Article]), AuthModule, UsersModule],
  controllers: [ArticlesController],
  providers: [
    ArticlesRepository,
    ArticlesService,
    JwtAuthGuard,
    ArticleOwnerGuard,
  ],
  exports: [ArticlesService],
})
export class ArticlesModule {}
