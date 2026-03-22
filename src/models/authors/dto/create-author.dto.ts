import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, Length } from 'class-validator';

export class CreateAuthorDto {
  @ApiProperty({ minLength: 2, maxLength: 200 })
  @IsString()
  @Length(2, 200)
  name: string;

  @ApiPropertyOptional({ minLength: 10, maxLength: 5000 })
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsOptional()
  @IsString()
  @Length(10, 5000)
  bio?: string;

  @ApiPropertyOptional({ type: 'string', format: 'binary' })
  @IsOptional()
  avatar?: unknown;
}
