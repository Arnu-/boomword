import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let message: string;
    let code: string;
    let errors: any[] | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object') {
        const resp = exceptionResponse as any;
        message = resp.message || exception.message;
        code = resp.code || `E${status}`;
        errors = Array.isArray(resp.message) ? resp.message : undefined;
        if (errors) {
          message = '参数验证失败';
        }
      } else {
        message = exceptionResponse as string;
        code = `E${status}`;
      }
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = '服务器内部错误';
      code = 'E500';

      // 记录未知错误
      this.logger.error(
        `Unhandled exception: ${exception}`,
        exception instanceof Error ? exception.stack : '',
      );
    }

    const errorResponse = {
      success: false,
      code,
      message,
      errors,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(status).json(errorResponse);
  }
}
