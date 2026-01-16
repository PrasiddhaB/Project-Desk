/**
 * Authentication API service
 */

import client from '@/services/http/client';
import { 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse, 
  ApiResponse,
  User 
} from '@/features/auth/types';

export const authApi = {
  /**
   * Register a new user
   */
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await client.post<AuthResponse>('/auth/register/', data);
    return response.data;
  },

  /**
   * Login user
   */
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await client.post<AuthResponse>('/auth/login/', data);
    return response.data;
  },

  /**
   * Logout user
   */
  logout: async (refreshToken: string): Promise<ApiResponse> => {
    const response = await client.post<ApiResponse>('/auth/logout/', {
      refresh: refreshToken,
    });
    return response.data;
  },

  /**
   * Get current user profile
   */
  me: async (): Promise<ApiResponse<User>> => {
    const response = await client.get<ApiResponse<User>>('/auth/me/');
    return response.data;
  },

  /**
   * Refresh access token
   */
  refreshToken: async (refreshToken: string): Promise<ApiResponse<{ tokens: { access: string; refresh?: string } }>> => {
    const response = await client.post<ApiResponse<{ tokens: { access: string; refresh?: string } }>>('/auth/token/refresh/', {
      refresh: refreshToken,
    });
    return response.data;
  },
};

export default authApi;
