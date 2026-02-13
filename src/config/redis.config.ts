import { registerAs } from '@nestjs/config';

export const redisConfig = registerAs('redis', () => ({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT as string, 10) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
}));
