import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
} from '../schemas/auth';

export class AuthController {
  // Регистрация
  static async register(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const validatedData = registerSchema.parse(req.body);
      const result = await AuthService.register(
        validatedData.email,
        validatedData.password,
        validatedData.name
      );

      res.status(201).json({
        message: 'User registered successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // Вход
  static async login(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const validatedData = loginSchema.parse(req.body);
      const result = await AuthService.login(
        validatedData.email,
        validatedData.password
      );

      res.json({
        message: 'Login successful',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // Получение профиля текущего пользователя
  static async getProfile(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      res.json({
        message: 'Profile retrieved successfully',
        data: { user: req.user },
      });
    } catch (error) {
      next(error);
    }
  }

  // Изменение пароля
  static async changePassword(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const validatedData = changePasswordSchema.parse(req.body);

      // Получаем полные данные пользователя для проверки текущего пароля
      const fullUser = await UserService.findUserByEmail(req.user.email);
      if (!fullUser) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Проверяем текущий пароль
      const isCurrentPasswordValid = await UserService.verifyPassword(
        validatedData.currentPassword,
        fullUser.password
      );

      if (!isCurrentPasswordValid) {
        res.status(400).json({ error: 'Current password is incorrect' });
        return;
      }

      // Изменяем пароль
      await UserService.changePassword(req.user.id, validatedData.newPassword);

      res.json({
        message: 'Password changed successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}
