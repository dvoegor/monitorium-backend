import { User } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { createError } from '../middleware/error-handler';
import { CacheService } from '../cache/cache';
import { UserWithoutPassword } from '../types/auth.types';
import { prisma } from '../lib/prisma';
import { RequestUser, RegisterData, OAuthData } from '../types/auth.types';
// import { cache } from '../cache/cache'; // Временно отключено

export class UserService {
  /**
   * Получить всех пользователей (без паролей) - временная заглушка
   */
  static async getAllUsers(): Promise<RequestUser[]> {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name || undefined,
      phone: undefined, // TODO: После миграции
      district: undefined, // TODO: После миграции
      verified: false, // TODO: После миграции
      isRepresentative: false, // TODO: После миграции
      role: user.role as 'USER' | 'REPRESENTATIVE' | 'ADMIN',
      position: undefined, // TODO: После миграции
      party: undefined, // TODO: После миграции
      rating: undefined, // TODO: После миграции
      balance: 0, // TODO: После миграции
    }));
  }

  /**
   * Найти пользователя по ID (без пароля) - временная заглушка
   */
  static async findUserById(id: string): Promise<RequestUser | null> {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name || undefined,
      phone: undefined, // TODO: После миграции
      district: undefined, // TODO: После миграции
      verified: false, // TODO: После миграции
      isRepresentative: false, // TODO: После миграции
      role: user.role as 'USER' | 'REPRESENTATIVE' | 'ADMIN',
      position: undefined, // TODO: После миграции
      party: undefined, // TODO: После миграции
      rating: undefined, // TODO: После миграции
      balance: 0, // TODO: После миграции
    };
  }

  /**
   * Найти пользователя по email (с паролем для аутентификации)
   */
  static async findUserByEmail(email: string) {
    return await prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Найти пользователя по телефону - временная заглушка
   */
  static async findUserByPhone(phone: string) {
    // TODO: После миграции добавить поиск по телефону
    return null;
  }

  /**
   * Создать нового пользователя - временная заглушка
   */
  static async createUser(userData: RegisterData): Promise<RequestUser> {
    // Проверяем, существует ли пользователь с таким email
    const existingUser = await this.findUserByEmail(userData.email);
    if (existingUser) {
      throw createError('User with this email already exists', 400);
    }

    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(userData.password, 12);

    const user = await prisma.user.create({
      data: {
        email: userData.email,
        password: hashedPassword,
        name: userData.name,
        // TODO: После миграции добавить остальные поля
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name || undefined,
      phone: userData.phone, // Сохраняем в памяти до миграции
      district: userData.district,
      verified: false,
      isRepresentative: userData.isRepresentative || false,
      role: 'USER',
      position: userData.position,
      party: userData.party,
      rating: undefined,
      balance: 10, // Бонус за регистрацию
    };
  }

  /**
   * Создать пользователя через OAuth - временная заглушка
   */
  static async createOAuthUser(oauthData: OAuthData): Promise<RequestUser> {
    // Проверяем, существует ли пользователь с таким email
    const existingUser = await this.findUserByEmail(oauthData.email);
    if (existingUser) {
      throw createError('User with this email already exists', 400);
    }

    const user = await prisma.user.create({
      data: {
        email: oauthData.email,
        password: '', // Временно пустой пароль для OAuth пользователей
        name: oauthData.name,
        // TODO: После миграции добавить OAuth поля
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name || undefined,
      phone: oauthData.phone,
      district: undefined,
      verified: oauthData.verified || true,
      isRepresentative: false,
      role: 'USER',
      position: undefined,
      party: undefined,
      rating: undefined,
      balance: 10, // Бонус за регистрацию
    };
  }

  /**
   * Обновить пользователя - временная заглушка
   */
  static async updateUser(
    id: string,
    updateData: Partial<{
      name: string;
      phone: string;
      district: string;
      position: string;
      party: string;
    }>
  ): Promise<RequestUser> {
    const user = await prisma.user.update({
      where: { id },
      data: {
        name: updateData.name,
        // TODO: После миграции добавить остальные поля
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name || undefined,
      phone: updateData.phone,
      district: updateData.district,
      verified: false,
      isRepresentative: false,
      role: user.role as 'USER' | 'REPRESENTATIVE' | 'ADMIN',
      position: updateData.position,
      party: updateData.party,
      rating: undefined,
      balance: 0,
    };
  }

  /**
   * Удалить пользователя
   */
  static async deleteUser(id: string): Promise<void> {
    await prisma.user.delete({
      where: { id },
    });
  }

  /**
   * Изменить пароль пользователя
   */
  static async changePassword(id: string, newPassword: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });
  }

  /**
   * Проверить пароль
   */
  static async verifyPassword(
    plainPassword: string,
    hashedPassword: string
  ): Promise<boolean> {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Верифицировать пользователя - временная заглушка
   */
  static async verifyUser(id: string): Promise<RequestUser> {
    const user = await this.findUserById(id);
    if (!user) {
      throw createError('User not found', 404);
    }

    // TODO: После миграции обновлять поле verified в БД
    return {
      ...user,
      verified: true,
    };
  }

  /**
   * Получить представителей власти - временная заглушка
   */
  static async getRepresentatives(): Promise<RequestUser[]> {
    // TODO: После миграции фильтровать по isRepresentative
    const users = await this.getAllUsers();
    return users.filter(user => user.isRepresentative);
  }
}
