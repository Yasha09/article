import 'dotenv/config';
import { join } from 'path';
import { DataSource } from 'typeorm';
import { getDataSourceOptions } from './typeorm.config';

export default new DataSource(
  getDataSourceOptions({
    migrations: [join(__dirname, 'migrations/*{.ts,.js}')],
    logging: true,
  }),
);
