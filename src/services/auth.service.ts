import jwt from 'jsonwebtoken';
import { UserService } from './user.service';
import { createError } from '../middleware/error-handler';
import {
  AuthResponse,
  RegisterData,
  OAuthData,
  RequestUser,
} from '../types/auth.types';
import { prisma } from '../lib/prisma';

export class AuthService {
  private static readonly JWT_SECRET =
    process.env.JWT_SECRET || 'your-secret-key';
  private static readonly JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

  /**
   * Регистрация нового пользователя
   */
  static async register(
    email: string,
    password: string,
    name: string,
    phone?: string,
    district?: string,
    isRepresentative?: boolean,
    position?: string,
    party?: string
  ): Promise<AuthResponse> {
    const userData: RegisterData = {
      email,
      password,
      name,
      phone,
      district,
      isRepresentative,
      position,
      party,
    };

    const user = await UserService.createUser(userData);
    const token = this.generateToken(user.id);

    return { user, token };
  }

  /**
   * Авторизация пользователя
   */
  static async login(email: string, password: string): Promise<AuthResponse> {
    // Находим пользователя с паролем
    const userWithPassword = await UserService.findUserByEmail(email);
    if (!userWithPassword || !userWithPassword.password) {
      throw createError('Invalid credentials', 401);
    }

    // Проверяем пароль
    const isPasswordValid = await UserService.verifyPassword(
      password,
      userWithPassword.password
    );

    if (!isPasswordValid) {
      throw createError('Invalid credentials', 401);
    }

    // Получаем пользователя без пароля
    const user = await UserService.findUserById(userWithPassword.id);
    if (!user) {
      throw createError('User not found', 404);
    }

    // Обновляем последнюю активность для представителей
    if (user.isRepresentative) {
      await this.updateLastActivity(user.id);
    }

    const token = this.generateToken(user.id);
    return { user, token };
  }

  /**
   * OAuth авторизация
   */
  static async oauthLogin(oauthData: OAuthData): Promise<AuthResponse> {
    // Проверяем, существует ли пользователь с таким email
    const existingUser = await UserService.findUserByEmail(oauthData.email);

    let user: RequestUser;

    if (existingUser) {
      // Пользователь существует, получаем его данные
      const foundUser = await UserService.findUserById(existingUser.id);
      if (!foundUser) {
        throw createError('User not found', 404);
      }
      user = foundUser;

      // Обновляем последнюю активность для представителей
      if (user.isRepresentative) {
        await this.updateLastActivity(user.id);
      }
    } else {
      // Создаем нового пользователя
      user = await UserService.createOAuthUser(oauthData);
    }

    const token = this.generateToken(user.id);
    return { user, token };
  }

  /**
   * Получение пользователя по токену
   */
  static async getUserFromToken(token: string): Promise<RequestUser> {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as { userId: string };
      const user = await UserService.findUserById(decoded.userId);

      if (!user) {
        throw createError('User not found', 404);
      }

      return user;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw createError('Invalid token', 401);
      }
      throw error;
    }
  }

  /**
   * Генерация JWT токена
   */
  private static generateToken(userId: string): string {
    return jwt.sign({ userId }, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN,
    } as jwt.SignOptions);
  }

  /**
   * Обновление последней активности представителя
   */
  private static async updateLastActivity(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { lastActivity: new Date() },
    });
  }

  /**
   * Верификация пользователя
   */
  static async verifyUser(userId: string): Promise<RequestUser> {
    return await UserService.verifyUser(userId);
  }

  /**
   * Сброс пароля (заглушка для будущей реализации)
   */
  static async requestPasswordReset(email: string): Promise<void> {
    const user = await UserService.findUserByEmail(email);
    if (!user) {
      // Не раскрываем информацию о существовании пользователя
      return;
    }

    // TODO: Реализовать отправку email с токеном сброса
    console.log(`Password reset requested for ${email}`);
  }

  /**
   * Подтверждение сброса пароля (заглушка для будущей реализации)
   */
  static async resetPassword(
    token: string,
    newPassword: string
  ): Promise<void> {
    // TODO: Реализовать проверку токена и сброс пароля
    throw createError('Password reset not implemented yet', 501);
  }
}
