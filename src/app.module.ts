import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { config } from './config';
import { envValidationSchema } from './config/config-validation.schema';
import { AuthModule } from './models/auth/auth.module';
import { ArticlesModule } from './models/addresses/articles.module';
import { RedisModule } from './infrastructure/cache/redis.module';
import { UsersModule } from './models/users/users.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { getTypeOrmConfig } from './infrastructure/persistence/typeorm.config';

@Module({
  controllers: [AppController],
  providers: [AppService],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: config,
      validationSchema: envValidationSchema,
      envFilePath: ['.env'],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        getTypeOrmConfig({
          host: configService.get<string>('database.host'),
          port: configService.get<number>('database.port'),
          username: configService.get<string>('database.username'),
          password: configService.get<string>('database.password'),
          database: configService.get<string>('database.name'),
        }),
    }),
    RedisModule,
    UsersModule,
    AuthModule,
    ArticlesModule,
  ],
})
export class AppModule {}
