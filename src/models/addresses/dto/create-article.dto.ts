import { ApiProperty } from '@nestjs/swagger';
import { IsISO8601, IsString, Length } from 'class-validator';

export class CreateArticleDto {
  @ApiProperty({ minLength: 3, maxLength: 200 })
  @IsString()
  @Length(3, 200)
  title: string;

  @ApiProperty({ minLength: 10, maxLength: 5000 })
  @IsString()
  @Length(10, 5000)
  description: string;

  @ApiProperty({ example: '2026-02-12T10:00:00.000Z' })
  @IsISO8601()
  publishedAt: string;
}
