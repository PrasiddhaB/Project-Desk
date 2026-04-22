/**
 * Authentication API service
 */

import client from '@/services/http/client';
import {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  ApiResponse,
  User,
} from '@/features/auth/types';

export const authApi = {
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await client.post<AuthResponse>('/auth/register/', data);
    return response.data;
  },

  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await client.post<AuthResponse>('/auth/login/', data);
    return response.data;
  },

  logout: async (refreshToken: string): Promise<ApiResponse> => {
    const response = await client.post<ApiResponse>('/auth/logout/', {
      refresh: refreshToken,
    });
    return response.data;
  },

  me: async (): Promise<ApiResponse<User>> => {
    const response = await client.get<ApiResponse<User>>('/auth/me/');
    return response.data;
  },

  refreshToken: async (
    refreshToken: string
  ): Promise<ApiResponse<{ tokens: { access: string; refresh?: string } }>> => {
    const response = await client.post<
      ApiResponse<{ tokens: { access: string; refresh?: string } }>
    >('/auth/token/refresh/', { refresh: refreshToken });
    return response.data;
  },

  // -------------------------------------------------------------------
  // Phase 2: Email verification (6-digit OTP)
  // -------------------------------------------------------------------
  verifyEmail: async (code: string): Promise<ApiResponse<User>> => {
    const response = await client.post<ApiResponse<User>>(
      '/auth/verify-email/',
      { code }
    );
    return response.data;
  },

  resendVerificationCode: async (): Promise<ApiResponse<null>> => {
    const response = await client.post<ApiResponse<null>>(
      '/auth/resend-verification/',
      {}
    );
    return response.data;
  },

  // -------------------------------------------------------------------
  // Phase 2: Forgot password via email (6-digit OTP)
  // -------------------------------------------------------------------
  forgotPasswordEmail: async (email: string): Promise<ApiResponse<null>> => {
    const response = await client.post<ApiResponse<null>>(
      '/auth/forgot-password-email/',
      { email }
    );
    return response.data;
  },

  resetPasswordEmail: async (
    email: string,
    code: string,
    newPassword: string
  ): Promise<ApiResponse<null>> => {
    const response = await client.post<ApiResponse<null>>(
      '/auth/reset-password-email/',
      { email, code, new_password: newPassword }
    );
    return response.data;
  },
};

export default authApi;
