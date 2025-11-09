import { Request } from 'express';

export interface User {
  id: number;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  plan: string;
  availableCredits: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserResponse {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  plan: string;
  availableCredits: number;
  createdAt: Date;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  plan?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface TokenPayload {
  userId: number;
  email: string;
}

export interface RefreshTokenPayload {
  userId: number;
  email: string;
  tokenVersion?: number;
}

export interface AuthRequest extends Request {
  user?: any;
}
