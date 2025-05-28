import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../logger/logger';
import { AppError } from '../types/error.types';

export const errorHandler = (
  err: AppError | ZodError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Логируем ошибку
  logger.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
  });

  // Обработка Zod ошибок валидации
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Validation error',
      details: err.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  // Обработка Prisma ошибок
  if (err.message.includes('Unique constraint')) {
    res.status(409).json({
      error: 'Resource already exists',
    });
    return;
  }

  // Обработка кастомных ошибок
  if (err.statusCode) {
    res.status(err.statusCode).json({
      error: err.message,
    });
    return;
  }

  // Обработка неизвестных ошибок
  res.status(500).json({
    error:
      process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message,
  });
};

// Утилита для создания кастомных ошибок
export const createError = (message: string, statusCode: number): AppError => {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};
