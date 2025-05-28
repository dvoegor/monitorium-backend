import { User } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { createError } from '../middleware/error-handler';
import { CacheService } from '../cache/cache';
import { UserWithoutPassword } from '../types/auth.types';
import { prisma } from '../lib/prisma';
import { RequestUser, RegisterData, OAuthData } from '../types/auth.types';
import { cache } from '../cache/cache';

export class UserService {
  /**
   * Получить всех пользователей (без паролей)
   */
  static async getAllUsers(): Promise<RequestUser[]> {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        district: true,
        verified: true,
        isRepresentative: true,
        role: true,
        position: true,
        party: true,
        rating: true,
        tasksTotal: true,
        tasksCompleted: true,
        attendance: true,
        lastActivity: true,
        balance: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name || undefined,
      phone: user.phone || undefined,
      district: user.district || undefined,
      verified: user.verified,
      isRepresentative: user.isRepresentative,
      role: user.role as 'USER' | 'REPRESENTATIVE' | 'ADMIN',
      position: user.position || undefined,
      party: user.party || undefined,
      rating: user.rating || undefined,
      balance: user.balance,
    }));
  }

  /**
   * Найти пользователя по ID (без пароля)
   */
  static async findUserById(id: string): Promise<RequestUser | null> {
    const cacheKey = `user:${id}`;
    const cached = cache.get<RequestUser>(cacheKey);
    if (cached) {
      return cached;
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        district: true,
        verified: true,
        isRepresentative: true,
        role: true,
        position: true,
        party: true,
        rating: true,
        tasksTotal: true,
        tasksCompleted: true,
        attendance: true,
        lastActivity: true,
        balance: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return null;
    }

    const requestUser: RequestUser = {
      id: user.id,
      email: user.email,
      name: user.name || undefined,
      phone: user.phone || undefined,
      district: user.district || undefined,
      verified: user.verified,
      isRepresentative: user.isRepresentative,
      role: user.role as 'USER' | 'REPRESENTATIVE' | 'ADMIN',
      position: user.position || undefined,
      party: user.party || undefined,
      rating: user.rating || undefined,
      balance: user.balance,
    };

    cache.set(cacheKey, requestUser, 300); // 5 минут
    return requestUser;
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
   * Найти пользователя по телефону
   */
  static async findUserByPhone(phone: string) {
    return await prisma.user.findUnique({
      where: { phone },
    });
  }

  /**
   * Создать нового пользователя
   */
  static async createUser(userData: RegisterData): Promise<RequestUser> {
    // Проверяем, существует ли пользователь с таким email
    const existingUser = await this.findUserByEmail(userData.email);
    if (existingUser) {
      throw createError('User with this email already exists', 400);
    }

    // Проверяем телефон, если указан
    if (userData.phone) {
      const existingPhone = await this.findUserByPhone(userData.phone);
      if (existingPhone) {
        throw createError('User with this phone already exists', 400);
      }
    }

    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(userData.password, 12);

    // Определяем роль
    let role: 'USER' | 'REPRESENTATIVE' | 'ADMIN' = 'USER';
    if (userData.isRepresentative) {
      role = 'REPRESENTATIVE';
    }

    const user = await prisma.user.create({
      data: {
        email: userData.email,
        password: hashedPassword,
        name: userData.name,
        phone: userData.phone,
        district: userData.district,
        isRepresentative: userData.isRepresentative || false,
        role,
        position: userData.position,
        party: userData.party,
        balance: userData.isRepresentative ? 0 : 10, // Бонус за регистрацию для обычных пользователей
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        district: true,
        verified: true,
        isRepresentative: true,
        role: true,
        position: true,
        party: true,
        rating: true,
        balance: true,
      },
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name || undefined,
      phone: user.phone || undefined,
      district: user.district || undefined,
      verified: user.verified,
      isRepresentative: user.isRepresentative,
      role: user.role as 'USER' | 'REPRESENTATIVE' | 'ADMIN',
      position: user.position || undefined,
      party: user.party || undefined,
      rating: user.rating || undefined,
      balance: user.balance,
    };
  }

  /**
   * Создать пользователя через OAuth
   */
  static async createOAuthUser(oauthData: OAuthData): Promise<RequestUser> {
    // Проверяем, существует ли пользователь с таким email
    const existingUser = await this.findUserByEmail(oauthData.email);
    if (existingUser) {
      throw createError('User with this email already exists', 400);
    }

    const providerField = `${oauthData.provider}Id`;

    const user = await prisma.user.create({
      data: {
        email: oauthData.email,
        name: oauthData.name,
        phone: oauthData.phone,
        verified: oauthData.verified || true, // OAuth пользователи считаются верифицированными
        [providerField]: oauthData.providerId,
        balance: 10, // Бонус за регистрацию
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        district: true,
        verified: true,
        isRepresentative: true,
        role: true,
        position: true,
        party: true,
        rating: true,
        balance: true,
      },
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name || undefined,
      phone: user.phone || undefined,
      district: user.district || undefined,
      verified: user.verified,
      isRepresentative: user.isRepresentative,
      role: user.role as 'USER' | 'REPRESENTATIVE' | 'ADMIN',
      position: user.position || undefined,
      party: user.party || undefined,
      rating: user.rating || undefined,
      balance: user.balance,
    };
  }

  /**
   * Обновить пользователя
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
    // Проверяем телефон на уникальность, если он обновляется
    if (updateData.phone) {
      const existingPhone = await prisma.user.findFirst({
        where: {
          phone: updateData.phone,
          NOT: { id },
        },
      });
      if (existingPhone) {
        throw createError('User with this phone already exists', 400);
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        district: true,
        verified: true,
        isRepresentative: true,
        role: true,
        position: true,
        party: true,
        rating: true,
        balance: true,
      },
    });

    const requestUser: RequestUser = {
      id: user.id,
      email: user.email,
      name: user.name || undefined,
      phone: user.phone || undefined,
      district: user.district || undefined,
      verified: user.verified,
      isRepresentative: user.isRepresentative,
      role: user.role as 'USER' | 'REPRESENTATIVE' | 'ADMIN',
      position: user.position || undefined,
      party: user.party || undefined,
      rating: user.rating || undefined,
      balance: user.balance,
    };

    // Обновляем кеш
    const cacheKey = `user:${id}`;
    cache.set(cacheKey, requestUser, 300);

    return requestUser;
  }

  /**
   * Удалить пользователя
   */
  static async deleteUser(id: string): Promise<void> {
    await prisma.user.delete({
      where: { id },
    });

    // Удаляем из кеша
    const cacheKey = `user:${id}`;
    cache.del(cacheKey);
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
   * Верифицировать пользователя
   */
  static async verifyUser(id: string): Promise<RequestUser> {
    const user = await prisma.user.update({
      where: { id },
      data: { verified: true },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        district: true,
        verified: true,
        isRepresentative: true,
        role: true,
        position: true,
        party: true,
        rating: true,
        balance: true,
      },
    });

    const requestUser: RequestUser = {
      id: user.id,
      email: user.email,
      name: user.name || undefined,
      phone: user.phone || undefined,
      district: user.district || undefined,
      verified: user.verified,
      isRepresentative: user.isRepresentative,
      role: user.role as 'USER' | 'REPRESENTATIVE' | 'ADMIN',
      position: user.position || undefined,
      party: user.party || undefined,
      rating: user.rating || undefined,
      balance: user.balance,
    };

    // Обновляем кеш
    const cacheKey = `user:${id}`;
    cache.set(cacheKey, requestUser, 300);

    return requestUser;
  }

  /**
   * Получить представителей власти
   */
  static async getRepresentatives(): Promise<RequestUser[]> {
    const representatives = await prisma.user.findMany({
      where: { isRepresentative: true },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        district: true,
        verified: true,
        isRepresentative: true,
        role: true,
        position: true,
        party: true,
        rating: true,
        tasksTotal: true,
        tasksCompleted: true,
        attendance: true,
        lastActivity: true,
        balance: true,
      },
      orderBy: { rating: 'desc' },
    });

    return representatives.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name || undefined,
      phone: user.phone || undefined,
      district: user.district || undefined,
      verified: user.verified,
      isRepresentative: user.isRepresentative,
      role: user.role as 'USER' | 'REPRESENTATIVE' | 'ADMIN',
      position: user.position || undefined,
      party: user.party || undefined,
      rating: user.rating || undefined,
      balance: user.balance,
    }));
  }
}
