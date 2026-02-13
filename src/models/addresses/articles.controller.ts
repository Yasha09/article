import {
  Body,
  Controller,
  Delete,
  Get,
  ParseUUIDPipe,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../../common/interfaces/jwt-payload.interface';
import { ArticlesService } from './articles.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { QueryArticlesDto } from './dto/query-articles.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { ArticleOwnerGuard } from './guards/article-owner.guard';

@ApiTags('articles')
@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Get()
  findAll(@Query() query: QueryArticlesDto) {
    return this.articlesService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.articlesService.findOne(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Body() createArticleDto: CreateArticleDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.articlesService.create(createArticleDto, currentUser.userId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, ArticleOwnerGuard)
  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateArticleDto: UpdateArticleDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.articlesService.update(
      id,
      updateArticleDto,
      currentUser.userId,
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, ArticleOwnerGuard)
  @Delete(':id')
  remove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.articlesService.remove(id, currentUser.userId);
  }
}
