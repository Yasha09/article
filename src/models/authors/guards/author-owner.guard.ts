import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { AuthorsService } from '../authors.service';

@Injectable()
export class AuthorOwnerGuard implements CanActivate {
  constructor(private readonly authorsService: AuthorsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      params: { id: string };
      user: { userId: string };
    }>();

    const author = await this.authorsService.getAuthorOrFail(request.params.id);
    if (author.createdBy.id !== request.user.userId) {
      throw new ForbiddenException(
        'You are not allowed to modify this author',
      );
    }

    return true;
  }
}
