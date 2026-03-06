'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { fetchCurrentUser, logout as apiLogout, loginWithEmail } from './api';

export interface User {
  id: number;
  email: string;
  username: string | null;
  display_name: string;
  avatar_url: string | null;
  category_slugs: string[];
  jurisdiction: string | null;
  learnworlds_tags: string[];
  auth_provider: 'learnworlds' | 'standalone';
  onboarding_completed: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, recaptchaToken?: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
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

  async function login(email: string, password: string, recaptchaToken?: string) {
    setLoginError(null);
    setLoginLoading(true);
    try {
      const data = await loginWithEmail(email, password, recaptchaToken);
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
    <AuthContext.Provider value={{ user, loading, login, logout, setUser, loginError, loginLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
