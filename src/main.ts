import {
  BadRequestException,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

function formatValidationErrors(errors: ValidationError[]): string[] {
  return errors.flatMap((error) => {
    const ownConstraints = error.constraints
      ? Object.values(error.constraints)
      : [];

    const childConstraints = error.children?.length
      ? formatValidationErrors(error.children)
      : [];

    return [...ownConstraints, ...childConstraints];
  });
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const httpAdapterHost = app.get(HttpAdapterHost);

  app.setGlobalPrefix('api');

  app.useGlobalFilters(new GlobalExceptionFilter(httpAdapterHost));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
      exceptionFactory: (errors: ValidationError[]) =>
        new BadRequestException({
          message: formatValidationErrors(errors),
          error: 'Bad Request',
        }),
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('NestJS CRUD API')
    .setDescription(
      'JWT-protected articles API with PostgreSQL and Redis cache',
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const port = configService.get<number>('app.port', 3000);
  await app.listen(port);
}

void bootstrap();
