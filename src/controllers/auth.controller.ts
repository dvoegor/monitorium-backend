import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  oauthSchema,
  updateProfileSchema,
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
        validatedData.name,
        validatedData.phone,
        validatedData.district,
        validatedData.isRepresentative,
        validatedData.position,
        validatedData.party
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

  // OAuth авторизация
  static async oauthLogin(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const validatedData = oauthSchema.parse(req.body);
      const result = await AuthService.oauthLogin(validatedData);

      res.json({
        message: 'OAuth login successful',
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

  // Обновление профиля
  static async updateProfile(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const validatedData = updateProfileSchema.parse(req.body);
      const updatedUser = await UserService.updateUser(
        req.user.id,
        validatedData
      );

      res.json({
        message: 'Profile updated successfully',
        data: { user: updatedUser },
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
        fullUser.password || ''
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

  // Верификация пользователя
  static async verifyUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const verifiedUser = await AuthService.verifyUser(req.user.id);

      res.json({
        message: 'User verified successfully',
        data: { user: verifiedUser },
      });
    } catch (error) {
      next(error);
    }
  }

  // Запрос сброса пароля
  static async requestPasswordReset(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({ error: 'Email is required' });
        return;
      }

      await AuthService.requestPasswordReset(email);

      res.json({
        message: 'Password reset email sent if account exists',
      });
    } catch (error) {
      next(error);
    }
  }

  // Получить представителей власти
  static async getRepresentatives(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const representatives = await UserService.getRepresentatives();

      res.json({
        message: 'Representatives retrieved successfully',
        data: { representatives },
      });
    } catch (error) {
      next(error);
    }
  }
}
