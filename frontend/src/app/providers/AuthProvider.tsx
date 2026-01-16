/**
 * Authentication Provider
 * Manages global authentication state
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, AuthTokens, LoginRequest, RegisterRequest } from '@/features/auth/types';
import { authApi } from '@/features/auth/api/auth.api';
import { tokenService } from '@/services/auth/token';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  /**
   * Fetch current user from API
   */
  const refreshUser = useCallback(async () => {
    try {
      if (!tokenService.hasTokens()) {
        setUser(null);
        return;
      }

      const response = await authApi.me();
      if (response.success && response.data) {
        setUser(response.data);
      } else {
        setUser(null);
        tokenService.removeTokens();
      }
    } catch (error) {
      setUser(null);
      tokenService.removeTokens();
    }
  }, []);

  /**
   * Initialize auth state on mount
   */
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      await refreshUser();
      setIsLoading(false);
    };

    initAuth();
  }, [refreshUser]);

  /**
   * Handle user login
   */
  const login = async (data: LoginRequest) => {
    const response = await authApi.login(data);
    
    if (response.success && response.data) {
      const { user, tokens } = response.data;
      tokenService.setTokens(tokens.access, tokens.refresh);
      setUser(user);
    } else {
      throw new Error(response.message || 'Login failed');
    }
  };

  /**
   * Handle user registration
   */
  const register = async (data: RegisterRequest) => {
    const response = await authApi.register(data);
    
    if (response.success && response.data) {
      const { user, tokens } = response.data;
      tokenService.setTokens(tokens.access, tokens.refresh);
      setUser(user);
    } else {
      throw new Error(response.message || 'Registration failed');
    }
  };

  /**
   * Handle user logout
   */
  const logout = async () => {
    try {
      const refreshToken = tokenService.getRefreshToken();
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } catch (error) {
      // Ignore logout errors
    } finally {
      tokenService.removeTokens();
      setUser(null);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook to use auth context
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default AuthProvider;
