import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Res,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiTags,
} from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../../common/interfaces/jwt-payload.interface';
import { UploadedImageFile } from '../../common/uploads/upload.types';
import {
  buildStoredFilePath,
  createBookAssetsMulterOptions,
} from '../../common/uploads/upload.utils';
import { CreateBookDto } from './dto/create-book.dto';
import { QueryBooksDto } from './dto/query-books.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { BooksService } from './books.service';
import { BookOwnerGuard } from './guards/book-owner.guard';

const bookMultipartBody = {
  schema: {
    type: 'object',
    properties: {
      title: { type: 'string' },
      summary: { type: 'string' },
      publishedAt: { type: 'string', format: 'date-time' },
      authorId: { type: 'string', format: 'uuid' },
      cover: { type: 'string', format: 'binary' },
      bookFile: { type: 'string', format: 'binary' },
      categories: {
        type: 'array',
        items: { type: 'string' },
      },
    },
    required: ['title', 'summary', 'publishedAt', 'authorId'],
  },
};

interface BookUploadedFiles {
  cover?: UploadedImageFile[];
  bookFile?: UploadedImageFile[];
}

@ApiTags('books')
@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Get()
  findAll(@Query() query: QueryBooksDto) {
    return this.booksService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.booksService.findOne(id);
  }

  @Get(':id/download')
  async download(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Res() response: Response,
  ) {
    const downloadInfo = await this.booksService.getDownloadInfo(id);
    response.download(downloadInfo.absolutePath, downloadInfo.downloadName);
  }

  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody(bookMultipartBody)
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'cover', maxCount: 1 },
        { name: 'bookFile', maxCount: 1 },
      ],
      createBookAssetsMulterOptions(),
    ),
  )
  @Post()
  create(
    @Body() createBookDto: CreateBookDto,
    @CurrentUser() currentUser: AuthenticatedUser,
    @UploadedFiles() files?: BookUploadedFiles,
  ) {
    const coverImagePath = files?.cover?.[0]
      ? buildStoredFilePath('books', files.cover[0].filename)
      : null;
    const bookFilePath = files?.bookFile?.[0]
      ? buildStoredFilePath('books/files', files.bookFile[0].filename)
      : null;

    return this.booksService.create(
      createBookDto,
      currentUser.userId,
      coverImagePath,
      bookFilePath,
    );
  }

  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody(bookMultipartBody)
  @UseGuards(JwtAuthGuard, BookOwnerGuard)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'cover', maxCount: 1 },
        { name: 'bookFile', maxCount: 1 },
      ],
      createBookAssetsMulterOptions(),
    ),
  )
  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateBookDto: UpdateBookDto,
    @CurrentUser() currentUser: AuthenticatedUser,
    @UploadedFiles() files?: BookUploadedFiles,
  ) {
    const coverImagePath = files?.cover?.[0]
      ? buildStoredFilePath('books', files.cover[0].filename)
      : null;
    const bookFilePath = files?.bookFile?.[0]
      ? buildStoredFilePath('books/files', files.bookFile[0].filename)
      : null;

    return this.booksService.update(
      id,
      updateBookDto,
      currentUser.userId,
      coverImagePath,
      bookFilePath,
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, BookOwnerGuard)
  @Delete(':id')
  remove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.booksService.remove(id, currentUser.userId);
  }
}
