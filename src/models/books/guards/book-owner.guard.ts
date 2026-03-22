import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { BooksService } from '../books.service';

@Injectable()
export class BookOwnerGuard implements CanActivate {
  constructor(private readonly booksService: BooksService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      params: { id: string };
      user: { userId: string };
    }>();

    const book = await this.booksService.getBookOrFail(request.params.id);
    if (book.createdBy.id !== request.user.userId) {
      throw new ForbiddenException('You are not allowed to modify this book');
    }

    return true;
  }
}
