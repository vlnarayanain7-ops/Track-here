import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import * as authApi from '../api/auth';
import { setupRealtimeSync, disconnectSocket } from '../lib/socket';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  // Establish authenticated real-time WebSocket synchronization
  useEffect(() => {
    if (user && user._id) {
      const cleanup = setupRealtimeSync(queryClient);
      return () => {
        if (typeof cleanup === 'function') cleanup();
      };
    } else {
      disconnectSocket();
    }
  }, [user, queryClient]);

  const checkAuth = useCallback(async () => {
    try {
      const res = await authApi.getMe();
      setUser(res?.data?.user || res?.user || res);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const initializeCsrf = useCallback(async () => {
    try {
      await authApi.getCsrfToken();
    } catch {
      // Authentication calls will surface a meaningful error if the API is unavailable.
    }
  }, []);

  useEffect(() => {
    initializeCsrf().finally(checkAuth);
  }, [checkAuth, initializeCsrf]);

  const login = async (credentials) => {
    await initializeCsrf();
    const res = await authApi.login(credentials);
    await initializeCsrf();
    const u = res?.data?.user || res?.user || res;
    setUser(u);
    return u;
  };

  const register = async (userData) => {
    await initializeCsrf();
    const res = await authApi.register(userData);
    await initializeCsrf();
    const u = res?.data?.user || res?.user || res;
    setUser(u);
    return u;
  };

  const logout = async () => {
    try {
      disconnectSocket();
      await authApi.logout();
    } catch {
      // ignore
    }
    setUser(null);
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    checkAuth,
    initializeCsrf,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default useAuth;
