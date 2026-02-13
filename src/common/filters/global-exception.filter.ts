import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import type { Request } from 'express';
import {
  ErrorResponseBody,
  HttpExceptionResponse,
} from '../interfaces/error-response.interface';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();

    const req = ctx.getRequest<Request & { url?: string; method?: string }>();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const res = ctx.getResponse();

    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse: HttpExceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    const message = this.getMessage(exception, exceptionResponse);
    const error = this.getErrorName(statusCode, exception, exceptionResponse);

    const responseBody: ErrorResponseBody = {
      statusCode,
      timestamp: new Date().toISOString(),
      path: req?.url ?? httpAdapter.getRequestUrl(req),
      method: req?.method ?? 'UNKNOWN',
      message,
      error,
    };

    // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
    if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${responseBody.method} ${responseBody.path} -> ${statusCode}`,
        exception instanceof Error
          ? exception.stack
          : JSON.stringify(exception),
      );
    } else {
      this.logger.warn(
        `${responseBody.method} ${responseBody.path} -> ${statusCode}: ${Array.isArray(message) ? message.join(', ') : message}`,
      );
    }

    httpAdapter.reply(res, responseBody, statusCode);
  }

  private getMessage(
    exception: unknown,
    exceptionResponse: HttpExceptionResponse,
  ): string | string[] {
    if (exceptionResponse && typeof exceptionResponse === 'object') {
      const responseMessage = exceptionResponse.message;
      if (
        typeof responseMessage === 'string' ||
        Array.isArray(responseMessage)
      ) {
        return responseMessage as string | string[];
      }
    }

    if (exception instanceof HttpException) {
      return exception.message;
    }

    return 'Internal server error';
  }

  private getErrorName(
    statusCode: number,
    exception: unknown,
    exceptionResponse: HttpExceptionResponse,
  ): string {
    if (exceptionResponse && typeof exceptionResponse === 'object') {
      const responseError = exceptionResponse.error;
      if (typeof responseError === 'string') {
        return responseError;
      }
    }

    if (exception instanceof HttpException) {
      return exception.name;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
    return statusCode === HttpStatus.INTERNAL_SERVER_ERROR
      ? 'Internal Server Error'
      : 'Error';
  }
}
