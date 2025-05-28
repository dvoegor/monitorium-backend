import { User } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { createError } from '../middleware/error-handler';
import { CacheService } from '../cache/cache';
import { UserWithoutPassword } from '../types/auth.types';
import { prisma } from '../lib/prisma';

export class UserService {
  /**
   * Creates a new user
   * @param email - User email
   * @param password - User password (will be hashed)
   * @param name - Optional user name
   * @returns User object without password
   * @throws AppError if user already exists
   */
  static async createUser(
    email: string,
    password: string,
    name?: string
  ): Promise<UserWithoutPassword> {
    // Проверяем, существует ли пользователь
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw createError('User already exists', 409);
    }

    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(password, 12);

    // Создаем пользователя
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });

    // Убираем пароль из ответа
    const { password: _, ...userWithoutPassword } = user;

    // Кэшируем пользователя
    CacheService.set(`user:${user.id}`, userWithoutPassword, 300); // 5 минут

    return userWithoutPassword;
  }

  /**
   * Finds user by email (includes password for authentication)
   * @param email - User email
   * @returns User object with password or null
   */
  static async findUserByEmail(email: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Finds user by ID (without password)
   * @param id - User ID
   * @returns User object without password or null
   */
  static async findUserById(id: string): Promise<UserWithoutPassword | null> {
    // Сначала проверяем кэш
    const cachedUser = CacheService.get<UserWithoutPassword>(`user:${id}`);
    if (cachedUser) {
      return cachedUser;
    }

    // Если в кэше нет, ищем в БД
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

    if (user) {
      // Кэшируем результат
      CacheService.set(`user:${id}`, user, 300); // 5 минут
    }

    return user;
  }

  /**
   * Gets all users (without passwords)
   * @returns Array of user objects without passwords
   */
  static async getAllUsers(): Promise<UserWithoutPassword[]> {
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

    return users;
  }

  /**
   * Updates user information
   * @param id - User ID
   * @param data - Partial user data to update
   * @returns Updated user object without password
   */
  static async updateUser(
    id: string,
    data: Partial<Pick<User, 'name' | 'email'>>
  ): Promise<UserWithoutPassword> {
    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Обновляем кэш
    CacheService.set(`user:${id}`, user, 300);

    return user;
  }

  /**
   * Deletes a user
   * @param id - User ID
   */
  static async deleteUser(id: string): Promise<void> {
    await prisma.user.delete({
      where: { id },
    });

    // Удаляем из кэша
    CacheService.del(`user:${id}`);
  }

  /**
   * Verifies password against hash
   * @param plainPassword - Plain text password
   * @param hashedPassword - Hashed password from database
   * @returns True if password matches
   */
  static async verifyPassword(
    plainPassword: string,
    hashedPassword: string
  ): Promise<boolean> {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Changes user password
   * @param id - User ID
   * @param newPassword - New password (will be hashed)
   */
  static async changePassword(id: string, newPassword: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });
  }
}
