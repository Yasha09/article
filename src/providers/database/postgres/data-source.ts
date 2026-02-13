import 'dotenv/config';
import { join } from 'path';
import { DataSource } from 'typeorm';
import { Article } from '../../../models/addresses/entities/article.entity';
import { User } from '../../../models/users/entities/user.entity';

export default new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT),
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  entities: [User, Article],
  migrations: [join(__dirname, '../../../database/migrations/*{.ts,.js}')],
  synchronize: false,
  logging: true,
});
