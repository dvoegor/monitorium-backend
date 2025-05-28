import jwt from 'jsonwebtoken';
import { User } from '@prisma/client';
import { UserService } from './user.service';
import { createError } from '../middleware/error-handler';
import {
  JwtPayload,
  UserWithoutPassword,
  AuthResponse,
} from '../types/auth.types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export class AuthService {
  /**
   * Generates JWT token for user
   * @param user - User object without password
   * @returns JWT token string
   */
  static generateToken(user: UserWithoutPassword): string {
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    } as jwt.SignOptions);
  }

  /**
   * Verifies JWT token and returns payload
   * @param token - JWT token string
   * @returns Decoded JWT payload
   * @throws AppError if token is invalid
   */
  static verifyToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, JWT_SECRET) as JwtPayload;
    } catch (error) {
      throw createError('Invalid token', 401);
    }
  }

  /**
   * Registers a new user
   * @param email - User email
   * @param password - User password
   * @param name - Optional user name
   * @returns User object and JWT token
   */
  static async register(
    email: string,
    password: string,
    name?: string
  ): Promise<AuthResponse> {
    const user = await UserService.createUser(email, password, name);
    const token = this.generateToken(user);

    return {
      user,
      token,
    };
  }

  /**
   * Authenticates user with email and password
   * @param email - User email
   * @param password - User password
   * @returns User object and JWT token
   * @throws AppError if credentials are invalid
   */
  static async login(email: string, password: string): Promise<AuthResponse> {
    // Находим пользователя
    const user = await UserService.findUserByEmail(email);
    if (!user) {
      throw createError('Invalid credentials', 401);
    }

    // Проверяем пароль
    const isPasswordValid = await UserService.verifyPassword(
      password,
      user.password
    );
    if (!isPasswordValid) {
      throw createError('Invalid credentials', 401);
    }

    // Убираем пароль из ответа
    const { password: _, ...userWithoutPassword } = user;

    // Генерируем токен
    const token = this.generateToken(userWithoutPassword);

    return {
      user: userWithoutPassword,
      token,
    };
  }

  /**
   * Gets user from JWT token
   * @param token - JWT token string
   * @returns User object without password
   * @throws AppError if token is invalid or user not found
   */
  static async getUserFromToken(token: string): Promise<UserWithoutPassword> {
    const payload = this.verifyToken(token);
    const user = await UserService.findUserById(payload.userId);

    if (!user) {
      throw createError('User not found', 404);
    }

    return user;
  }
}
