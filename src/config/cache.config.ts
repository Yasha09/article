import { registerAs } from '@nestjs/config';

export const cacheConfig = registerAs('cache', () => ({
  ttlSeconds: parseInt(process.env.CACHE_TTL_SECONDS as string, 10) || 60,
}));
