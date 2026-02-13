import { ConfigFactory } from '@nestjs/config';
import { appConfig } from './app.config';
import { cacheConfig } from './cache.config';
import { databaseConfig } from './database.config';
import { jwtConfig } from './jwt.config';
import { redisConfig } from './redis.config';

export const config: ConfigFactory[] = [
  appConfig,
  databaseConfig,
  redisConfig,
  jwtConfig,
  cacheConfig,
];
