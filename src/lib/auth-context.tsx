'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { fetchCurrentUser, logout as apiLogout, getLoginUrl } from './api';

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
  login: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCurrentUser()
      .then(data => {
        setUser(data?.user ?? null);
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  function login() {
    window.location.href = getLoginUrl();
  }

  async function logout() {
    await apiLogout();
    setUser(null);
    window.location.href = getLoginUrl();
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
