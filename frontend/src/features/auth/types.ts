/**
 * Authentication related types.
 *
 * Role hierarchy:
 *   - superadmin: product owner (manages plans + global subscriptions)
 *   - admin:      company / project lead (needs a subscription, no payment portal)
 *   - employee:   regular user (needs a subscription)
 */

export type UserRole = 'superadmin' | 'admin' | 'employee';

export interface User {
  id: number;
  full_name: string;
  username: string;
  email: string;
  phone: string | null;
  role: UserRole;
  profile_pic: string | null;
  profile_pic_url?: string | null;
  is_active: boolean;
  is_email_verified?: boolean;
  is_welcomed?: boolean;
  is_online?: boolean;
  last_active?: string | null;
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  full_name: string;
  username: string;
  email: string;
  password: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    tokens: AuthTokens;
  };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

/**
 * Helper: true for both admin and superadmin (i.e. "elevated" users).
 * Matches the backend property of the same name.
 */
export const isElevated = (user: User | null | undefined): boolean =>
  !!user && (user.role === 'admin' || user.role === 'superadmin');

/**
 * Helper: true only for the product-owner role.
 */
export const isSuperAdmin = (user: User | null | undefined): boolean =>
  !!user && user.role === 'superadmin';

/**
 * Helper: true only for the middle 'admin' (company lead) role.
 */
export const isManagerOnly = (user: User | null | undefined): boolean =>
  !!user && user.role === 'admin';

/**
 * Helper: true if this user needs a paid subscription to access features
 * (admin and employee yes; superadmin no).
 */
export const needsSubscription = (user: User | null | undefined): boolean =>
  !!user && (user.role === 'admin' || user.role === 'employee');
