import { BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { basename, extname, join } from 'path';

const IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const BOOK_FILE_MIME_TYPES = new Set([
  'application/pdf',
  'application/epub+zip',
  'application/x-mobipocket-ebook',
  'text/plain',
]);

export const MAX_IMAGE_FILE_SIZE_BYTES = 5 * 1024 * 1024;
export const MAX_BOOK_FILE_SIZE_BYTES = 50 * 1024 * 1024;

function sanitizeBaseName(originalName: string): string {
  const normalized = originalName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return normalized || 'file';
}

export function createImageMulterOptions(directory: 'authors' | 'books') {
  return {
    storage: diskStorage({
      destination: (_request, _file, callback) => {
        const destination = join(process.cwd(), 'uploads', directory);
        mkdirSync(destination, { recursive: true });
        callback(null, destination);
      },
      filename: (_request, file, callback) => {
        const extension = extname(file.originalname).toLowerCase();
        const rawBaseName = basename(file.originalname, extension);
        const safeBaseName = sanitizeBaseName(rawBaseName).slice(0, 80);

        callback(
          null,
          `${Date.now()}-${randomUUID()}-${safeBaseName}${extension}`,
        );
      },
    }),
    limits: {
      fileSize: MAX_IMAGE_FILE_SIZE_BYTES,
    },
    fileFilter: (_request, file, callback) => {
      if (!IMAGE_MIME_TYPES.has(file.mimetype)) {
        callback(
          new BadRequestException('Only JPEG, PNG, WEBP, and GIF images are allowed'),
          false,
        );
        return;
      }

      callback(null, true);
    },
  };
}

export function createBookAssetsMulterOptions() {
  return {
    storage: diskStorage({
      destination: (_request, file, callback) => {
        const subdirectory =
          file.fieldname === 'bookFile' ? ['books', 'files'] : ['books'];
        const destination = join(process.cwd(), 'uploads', ...subdirectory);

        mkdirSync(destination, { recursive: true });
        callback(null, destination);
      },
      filename: (_request, file, callback) => {
        const extension = extname(file.originalname).toLowerCase();
        const rawBaseName = basename(file.originalname, extension);
        const safeBaseName = sanitizeBaseName(rawBaseName).slice(0, 80);

        callback(
          null,
          `${Date.now()}-${randomUUID()}-${safeBaseName}${extension}`,
        );
      },
    }),
    limits: {
      fileSize: MAX_BOOK_FILE_SIZE_BYTES,
    },
    fileFilter: (_request, file, callback) => {
      if (file.fieldname === 'cover') {
        if (!IMAGE_MIME_TYPES.has(file.mimetype)) {
          callback(
            new BadRequestException(
              'Book cover must be a JPEG, PNG, WEBP, or GIF image',
            ),
            false,
          );
          return;
        }

        callback(null, true);
        return;
      }

      if (file.fieldname === 'bookFile') {
        if (!BOOK_FILE_MIME_TYPES.has(file.mimetype)) {
          callback(
            new BadRequestException(
              'Book file must be PDF, EPUB, MOBI, or TXT',
            ),
            false,
          );
          return;
        }

        callback(null, true);
        return;
      }

      callback(new BadRequestException('Unsupported file field'), false);
    },
  };
}

export function buildStoredFilePath(
  directory: 'authors' | 'books' | 'books/files',
  filename: string,
): string {
  return `/uploads/${directory}/${filename}`;
}
