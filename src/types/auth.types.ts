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
  name?: string | null;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Authentication response interface
 */
export interface AuthResponse {
  user: UserWithoutPassword;
  token: string;
}
