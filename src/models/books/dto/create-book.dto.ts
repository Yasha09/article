import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MaxLength,
} from 'class-validator';

function normalizeStringArray(value: unknown): string[] | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return undefined;
    }

    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed
            .map((item) => String(item).trim())
            .filter(Boolean);
        }
      } catch {
        return [trimmed];
      }
    }

    return trimmed
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return undefined;
}

export class CreateBookDto {
  @ApiProperty({ minLength: 3, maxLength: 200 })
  @IsString()
  @Length(3, 200)
  title: string;

  @ApiProperty({ minLength: 10, maxLength: 5000 })
  @IsString()
  @Length(10, 5000)
  summary: string;

  @ApiProperty({ example: '2026-02-12T10:00:00.000Z' })
  @IsISO8601()
  publishedAt: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  authorId: string;

  @ApiPropertyOptional({ type: 'string', format: 'binary' })
  @IsOptional()
  cover?: unknown;

  @ApiPropertyOptional({ type: 'string', format: 'binary' })
  @IsOptional()
  bookFile?: unknown;

  @ApiPropertyOptional({
    type: [String],
    description:
      'Book categories by name. Accepts repeated form fields, comma-separated string, or JSON array string.',
  })
  @Transform(({ value }) => normalizeStringArray(value))
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  categories?: string[];
}
