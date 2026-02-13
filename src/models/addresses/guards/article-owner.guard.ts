import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ArticlesService } from '../articles.service';

@Injectable()
export class ArticleOwnerGuard implements CanActivate {
  constructor(private readonly articlesService: ArticlesService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      params: { id: string };
      user: { userId: string };
    }>();

    const article = await this.articlesService.getArticleOrFail(
      request.params.id,
    );
    if (article.author.id !== request.user.userId) {
      throw new ForbiddenException(
        'You are not allowed to modify this article',
      );
    }

    return true;
  }
}
