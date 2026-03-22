import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => {
  const port = parseInt(process.env.PORT as string, 10) || 3000;

  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    port,
    baseUrl: process.env.APP_BASE_URL || `http://localhost:${port}`,
  };
});
