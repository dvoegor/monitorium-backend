import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { createError } from './error-handler';

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      throw createError('Access token required', 401);
    }

    const user = await AuthService.getUserFromToken(token);
    req.user = user;

    next();
  } catch (error) {
    next(error);
  }
};

// Middleware для проверки роли администратора
export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return next(createError('Authentication required', 401));
  }

  if (req.user.role !== 'ADMIN') {
    return next(createError('Admin access required', 403));
  }

  next();
};
