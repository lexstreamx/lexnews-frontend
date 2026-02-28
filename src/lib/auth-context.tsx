'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { fetchCurrentUser, logout as apiLogout, loginWithEmail } from './api';

export interface User {
  id: number;
  email: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  category_slugs: string[];
  learnworlds_tags: string[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loginError: string | null;
  loginLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    fetchCurrentUser()
      .then(data => {
        setUser(data?.user ?? null);
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    setLoginError(null);
    setLoginLoading(true);
    try {
      const data = await loginWithEmail(email, password);
      setUser(data.user);
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Login failed');
      throw err;
    } finally {
      setLoginLoading(false);
    }
  }

  async function logout() {
    await apiLogout();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, loginError, loginLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
