'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { fetchJsonWithBuffer } from '@/lib/api-fetch';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  canLoadSampleData?: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (
    name: string,
    email: string,
    password: string,
    businessName?: string,
    currency?: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => ({ success: false }),
  signup: async () => ({ success: false }),
  logout: async () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const data = await fetchJsonWithBuffer('/api/auth/me', {
        timeoutMs: 15000,
        retry: true,
      });
      if (data.success && data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const authenticate = async (
    endpoint: '/api/auth/login' | '/api/auth/signup',
    payload: Record<string, string | undefined>,
    fallbackError: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const data = await fetchJsonWithBuffer(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        timeoutMs: 20000,
      });
      if (data.success && data.user) {
        setUser(data.user);
        return { success: true };
      }
      return { success: false, error: data.error || fallbackError };
    } catch (err: any) {
      return { success: false, error: err.message || fallbackError };
    }
  };

  const login = (email: string, password: string) =>
    authenticate('/api/auth/login', { email, password }, 'Failed to login');

  const signup = (
    name: string,
    email: string,
    password: string,
    businessName?: string,
    currency?: string
  ) =>
    authenticate(
      '/api/auth/signup',
      { name, email, password, businessName, currency },
      'Failed to create account'
    );

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('swiftcent_active_org');
        // Clear all user-specific active business keys
        Object.keys(localStorage)
          .filter((k) => k.startsWith('swiftcent_active_org'))
          .forEach((k) => localStorage.removeItem(k));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

