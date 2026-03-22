import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { constants as fsConstants } from 'fs';
import { access, unlink } from 'fs/promises';
import { join } from 'path';

@Injectable()
export class LocalFilesService {
  constructor(private readonly configService: ConfigService) {}

  buildPublicUrl(relativePath: string | null): string | null {
    if (!relativePath) {
      return null;
    }

    const baseUrl = this.configService
      .get<string>('app.baseUrl', 'http://localhost:3000')
      .replace(/\/$/, '');

    return `${baseUrl}${relativePath}`;
  }

  resolveAbsolutePath(relativePath: string): string {
    return join(process.cwd(), relativePath.replace(/^\/+/, ''));
  }

  async ensureFileExists(relativePath: string): Promise<string> {
    const absolutePath = this.resolveAbsolutePath(relativePath);
    await access(absolutePath, fsConstants.F_OK);
    return absolutePath;
  }

  async deleteFile(relativePath: string | null | undefined): Promise<void> {
    if (!relativePath) {
      return;
    }

    const absolutePath = this.resolveAbsolutePath(relativePath);

    try {
      await unlink(absolutePath);
    } catch (error: unknown) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }
}
