import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import type { DataSourceOptions } from 'typeorm';
import { Article } from './entities/article.entity';
import { User } from './entities/user.entity';

export interface TypeOrmConnectionOverrides {
  host?: string;
  port?: number | string;
  username?: string;
  password?: string;
  database?: string;
  migrations?: string[];
  logging?: boolean;
}

function resolvePort(port: number | string | undefined): number {
  const normalized = Number(port);
  return Number.isFinite(normalized) && normalized > 0 ? normalized : 5432;
}

export const getDataSourceOptions = (
  overrides: TypeOrmConnectionOverrides = {},
): DataSourceOptions => ({
  type: 'postgres',
  host: overrides.host ?? process.env.DATABASE_HOST ?? 'localhost',
  port: resolvePort(overrides.port ?? process.env.DATABASE_PORT),
  username: overrides.username ?? process.env.DATABASE_USERNAME ?? '',
  password: overrides.password ?? process.env.DATABASE_PASSWORD ?? '',
  database: overrides.database ?? process.env.DATABASE_NAME ?? '',
  entities: [User, Article],
  migrations: overrides.migrations ?? [
    'dist/infrastructure/persistence/migrations/*.js',
  ],
  synchronize: false,
  logging: overrides.logging ?? false,
});

export const getTypeOrmConfig = (
  overrides: TypeOrmConnectionOverrides = {},
): TypeOrmModuleOptions => getDataSourceOptions(overrides);
