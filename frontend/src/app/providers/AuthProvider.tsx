/**
 * Authentication Provider
 *
 * Fixes the "navbar changes on reload" bug by hydrating the user
 * synchronously from localStorage BEFORE the first render, so the
 * Layout never mounts in a logged-out state while /auth/me/ is
 * refreshing in the background.
 *
 * Also supports "remember me": when remember=true we persist in
 * localStorage (survives browser restarts); when remember=false we
 * use sessionStorage (cleared when the tab closes).
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { User, LoginRequest, RegisterRequest } from '@/features/auth/types';
import { authApi } from '@/features/auth/api/auth.api';
import { tokenService } from '@/services/auth/token';

const USER_CACHE_KEY = 'cached_user';

interface LoginOptions {
  remember?: boolean;
}

interface LoginResult {
  emailVerificationRequired: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginRequest, options?: LoginOptions) => Promise<LoginResult>;
  register: (data: RegisterRequest, options?: LoginOptions) => Promise<LoginResult>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Try to read a cached user synchronously. Returns null if unavailable
 * or malformed. Called once at provider construction so the first
 * render already has the correct user object.
 */
const readCachedUser = (): User | null => {
  try {
    const raw =
      localStorage.getItem(USER_CACHE_KEY) ||
      sessionStorage.getItem(USER_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as User;
    if (!parsed || typeof parsed !== 'object' || !parsed.id) return null;
    return parsed;
  } catch {
    return null;
  }
};

const writeCachedUser = (user: User | null, remember: boolean): void => {
  try {
    // Always clear from both stores first so we don't leave stale copies.
    localStorage.removeItem(USER_CACHE_KEY);
    sessionStorage.removeItem(USER_CACHE_KEY);
    if (!user) return;
    const store = remember ? localStorage : sessionStorage;
    store.setItem(USER_CACHE_KEY, JSON.stringify(user));
  } catch {
    /* storage quota / private mode - ignore */
  }
};

const clearCachedUser = (): void => {
  try {
    localStorage.removeItem(USER_CACHE_KEY);
    sessionStorage.removeItem(USER_CACHE_KEY);
  } catch {
    /* ignore */
  }
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Seed synchronously so the navbar doesn't flicker through a
  // "logged out" state while /auth/me/ refreshes in the background.
  const [user, setUser] = useState<User | null>(() => {
    if (tokenService.hasTokens()) return readCachedUser();
    return null;
  });

  // If we already have a cached user, don't block the UI with a
  // loading spinner - let the app render immediately and refresh in
  // the background. Only block when we have tokens but no cached
  // user (first hit after a hard cache wipe).
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    return tokenService.hasTokens() && !readCachedUser();
  });

  const isAuthenticated = !!user;

  const refreshUser = useCallback(async () => {
    try {
      if (!tokenService.hasTokens()) {
        setUser(null);
        clearCachedUser();
        return;
      }

      const response = await authApi.me();
      if (response.success && response.data) {
        setUser(response.data);
        // Preserve whichever store already held the cached user.
        const remember = !!localStorage.getItem(USER_CACHE_KEY) ||
          !sessionStorage.getItem(USER_CACHE_KEY);
        writeCachedUser(response.data, remember);
      } else {
        setUser(null);
        tokenService.removeTokens();
        clearCachedUser();
      }
    } catch {
      // On network error, keep the cached user but don't nuke tokens;
      // the interceptor will handle 401s if they come back.
    }
  }, []);

  // Refresh on mount; runs in the background when we already have a
  // cached user (non-blocking).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await refreshUser();
      if (!cancelled) setIsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshUser]);

  const login = async (data: LoginRequest, options: LoginOptions = {}): Promise<LoginResult> => {
    const remember = options.remember ?? true;
    const response = await authApi.login(data);

    if (response.success && response.data) {
      const { user: loggedInUser, tokens } = response.data;
      tokenService.setTokens(tokens.access, tokens.refresh);
      writeCachedUser(loggedInUser, remember);
      setUser(loggedInUser);
      const required = Boolean((response.data as any).email_verification_required);
      return { emailVerificationRequired: required };
    }
    throw new Error(response.message || 'Login failed');
  };

  const register = async (data: RegisterRequest, options: LoginOptions = {}): Promise<LoginResult> => {
    const remember = options.remember ?? true;
    const response = await authApi.register(data);

    if (response.success && response.data) {
      const { user: newUser, tokens } = response.data;
      tokenService.setTokens(tokens.access, tokens.refresh);
      writeCachedUser(newUser, remember);
      setUser(newUser);
      const required = Boolean((response.data as any).email_verification_required);
      return { emailVerificationRequired: required };
    }
    throw new Error(response.message || 'Registration failed');
  };

  const logout = async () => {
    try {
      const refreshToken = tokenService.getRefreshToken();
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } catch {
      /* ignore logout errors */
    } finally {
      tokenService.removeTokens();
      clearCachedUser();
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
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthProvider;
