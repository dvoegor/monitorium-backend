import { User } from '@prisma/client';

/**
 * JWT payload interface
 */
export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

/**
 * User without password field
 */
export type UserWithoutPassword = Omit<User, 'password'>;

/**
 * Express Request user interface
 */
export interface RequestUser {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  district?: string;
  verified: boolean;
  isRepresentative: boolean;
  role: 'USER' | 'REPRESENTATIVE' | 'ADMIN';
  position?: string;
  party?: string;
  rating?: number;
  balance: number;
}

/**
 * Authentication response interface
 */
export interface AuthResponse {
  user: RequestUser;
  token: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  phone?: string;
  district?: string;
  isRepresentative?: boolean;
  position?: string;
  party?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface OAuthData {
  provider: 'gosuslugi' | 'sber' | 'tinkoff';
  providerId: string;
  email: string;
  name: string;
  phone?: string;
  verified?: boolean;
}
