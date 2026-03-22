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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../../common/interfaces/jwt-payload.interface';
import { UploadedImageFile } from '../../common/uploads/upload.types';
import {
  buildStoredFilePath,
  createImageMulterOptions,
} from '../../common/uploads/upload.utils';
import { CreateAuthorDto } from './dto/create-author.dto';
import { QueryAuthorsDto } from './dto/query-authors.dto';
import { UpdateAuthorDto } from './dto/update-author.dto';
import { AuthorsService } from './authors.service';
import { AuthorOwnerGuard } from './guards/author-owner.guard';

const authorMultipartBody = {
  schema: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      bio: { type: 'string' },
      avatar: { type: 'string', format: 'binary' },
    },
    required: ['name'],
  },
};

@ApiTags('authors')
@Controller('authors')
export class AuthorsController {
  constructor(private readonly authorsService: AuthorsService) {}

  @Get()
  findAll(@Query() query: QueryAuthorsDto) {
    return this.authorsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.authorsService.findOne(id);
  }

  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody(authorMultipartBody)
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('avatar', createImageMulterOptions('authors')),
  )
  @Post()
  create(
    @Body() createAuthorDto: CreateAuthorDto,
    @CurrentUser() currentUser: AuthenticatedUser,
    @UploadedFile() file?: UploadedImageFile,
  ) {
    const avatarImagePath = file
      ? buildStoredFilePath('authors', file.filename)
      : null;

    return this.authorsService.create(
      createAuthorDto,
      currentUser.userId,
      avatarImagePath,
    );
  }

  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody(authorMultipartBody)
  @UseGuards(JwtAuthGuard, AuthorOwnerGuard)
  @UseInterceptors(
    FileInterceptor('avatar', createImageMulterOptions('authors')),
  )
  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateAuthorDto: UpdateAuthorDto,
    @CurrentUser() currentUser: AuthenticatedUser,
    @UploadedFile() file?: UploadedImageFile,
  ) {
    const avatarImagePath = file
      ? buildStoredFilePath('authors', file.filename)
      : null;

    return this.authorsService.update(
      id,
      updateAuthorDto,
      currentUser.userId,
      avatarImagePath,
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AuthorOwnerGuard)
  @Delete(':id')
  remove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.authorsService.remove(id, currentUser.userId);
  }
}
