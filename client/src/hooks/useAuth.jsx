import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import * as authApi from '../api/auth';
import { setupRealtimeSync, disconnectSocket } from '../lib/socket';
import { clearQueryCache } from '../lib/queryClient';
import { setAccountSession, getAccountSession } from '../lib/accountSession';
import { pauseOutbox, retryOutbox } from '../lib/outbox';
import { clearReportsLocal } from '../lib/localStore';

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

  const adoptUser = useCallback(async (next) => {
    const nextId = next?._id || next?.id || null;
    if (getAccountSession().ownerId !== nextId) {
      pauseOutbox();
      setAccountSession(null);
      await queryClient.cancelQueries();
      await clearQueryCache();
      setAccountSession(nextId);
    }
    setUser(next);
    if (nextId) void retryOutbox().catch(() => {});
  }, [queryClient]);

  const checking = useRef(null);
  const changing = useRef(false);
  const csrfReady = useRef(false);

  const checkAuth = useCallback(() => {
    if (changing.current || checking.current) return checking.current;
    checking.current = (async () => {
      try {
        const session = await authApi.getSession();
        csrfReady.current = true;
        let restored = session.user;
        if (!restored && session.canRefresh) {
          await authApi.refreshToken();
          restored = (await authApi.getMe()).data.user;
        }
        if (!changing.current) await adoptUser(restored);
      } catch (error) {
        if (!changing.current && [401, 403].includes(error.response?.status)) await adoptUser(null);
      } finally {
        checking.current = null;
        setIsLoading(false);
      }
    })();
    return checking.current;
  }, [adoptUser]);

  const initializeCsrf = useCallback(async () => {
    await authApi.getCsrfToken();
    csrfReady.current = true;
  }, []);

  useEffect(() => { void checkAuth(); }, [checkAuth]);

  // Wakeup recovery: When phone screen turns on or user returns to tab, restore session seamlessly
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkAuth();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [checkAuth]);

  const authenticate = async (request, payload) => {
    changing.current = true;
    try {
      await checking.current;
      if (!csrfReady.current) await initializeCsrf();
      let response;
      try {
        response = await request(payload);
      } catch (error) {
        // An expired cookie or a session change in another tab can invalidate the token.
        if (error.response?.status !== 403 || !/^CSRF token (missing|invalid)$/i.test(error.response?.data?.message || '')) throw error;
        await initializeCsrf();
        response = await request(payload);
      }
      const next = response.data.user;
      await adoptUser(next);
      return next;
    } finally {
      changing.current = false;
    }
  };

  const login = credentials => authenticate(authApi.login, credentials);
  const register = data => authenticate(authApi.register, data);
  const googleLogin = credential => authenticate(authApi.googleLogin, credential);

  const logout = async () => {
    changing.current = true;
    await checking.current;
    csrfReady.current = false;
    pauseOutbox();
    setAccountSession(null);
    await queryClient.cancelQueries();
    try {
      disconnectSocket();
      await authApi.logout();
    } catch {
      // ignore
    }
    try {
      await clearQueryCache();
      await clearReportsLocal();
      localStorage.removeItem('trackhere_active_timer_v2');
    } catch {
      // ignore
    }
    setUser(null);
    changing.current = false;
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    googleLogin,
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
