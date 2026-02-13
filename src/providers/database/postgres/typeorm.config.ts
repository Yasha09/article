import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Article } from '../../../models/addresses/entities/article.entity';
import { User } from '../../../models/users/entities/user.entity';

export const getTypeOrmConfig = (): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT),
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  entities: [User, Article],
  migrations: ['dist/database/migrations/*.js'],
  synchronize: false,
  logging: false,
});
