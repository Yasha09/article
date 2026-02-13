export interface ErrorResponseBody {
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  message: string | string[];
  error: string;
}

export interface HttpExceptionResponsePayload {
  message?: unknown;
  error?: unknown;
}

export type HttpExceptionResponse =
  | string
  | HttpExceptionResponsePayload
  | null;
