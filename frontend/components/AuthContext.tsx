'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

// ─── Types ──────────────────────────────────────────────────────────

export type UserRole = 'medico' | 'gps' | 'admin';

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  /** Check if the user has one of the given roles */
  hasRole: (...roles: UserRole[]) => boolean;
  /** Check if the current user can access a specific page */
  canAccess: (page: AppPage) => boolean;
  /** Check if the current user can perform a specific action */
  canPerform: (action: AppAction) => boolean;
}

// ─── Pages & Actions ────────────────────────────────────────────────

export type AppPage =
  | 'bienvenida'
  | 'monitor'
  | 'resumen'
  | 'jugadores'
  | 'medico'
  | 'ingesta'
  | 'admin_usuarios';

export type AppAction =
  | 'upload_csv'
  | 'edit_player'
  | 'edit_clinical_file'
  | 'create_player'
  | 'manage_users';

// ─── Permission Matrices ────────────────────────────────────────────

const PAGE_ACCESS: Record<AppPage, UserRole[]> = {
  bienvenida: ['medico', 'gps', 'admin'],
  monitor: ['gps', 'admin'],
  resumen: ['gps', 'admin'],
  jugadores: ['medico', 'gps', 'admin'],
  medico: ['medico', 'admin'],
  ingesta: ['gps'],
  admin_usuarios: ['admin'],
};

const ACTION_ACCESS: Record<AppAction, UserRole[]> = {
  upload_csv: ['gps'],
  edit_player: ['gps', 'admin'],
  edit_clinical_file: ['medico'],
  create_player: ['gps', 'admin'],
  manage_users: ['admin'],
};

// ─── Context ────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const tokenMatch = document.cookie.match(/(?:^|; )auth_token=([^;]*)/);
        const token = tokenMatch ? tokenMatch[1] : null;

        if (!token) {
          setUser(null);
          setLoading(false);
          return;
        }

        const response = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          setUser(null);
          document.cookie = 'auth_token=; path=/; max-age=0';
          return;
        }

        const data = await response.json();
        setUser(data.user as AuthUser);
      } catch (err) {
        console.error('Error fetching user:', err);
        setError('Error al obtener usuario');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const logout = useCallback(async () => {
    try {
      const tokenMatch = document.cookie.match(/(?:^|; )auth_token=([^;]*)/);
      const token = tokenMatch ? tokenMatch[1] : null;

      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      document.cookie = 'auth_token=; path=/; max-age=0';
      document.cookie = 'rememberMe=; path=/; max-age=0';
      setUser(null);
      window.location.href = '/login';
    }
  }, []);

  const hasRole = useCallback(
    (...roles: UserRole[]) => {
      if (!user) return false;
      return roles.includes(user.role);
    },
    [user],
  );

  const canAccess = useCallback(
    (page: AppPage) => {
      if (!user) return false;
      return PAGE_ACCESS[page].includes(user.role);
    },
    [user],
  );

  const canPerform = useCallback(
    (action: AppAction) => {
      if (!user) return false;
      return ACTION_ACCESS[action].includes(user.role);
    },
    [user],
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        isAuthenticated: !!user,
        logout,
        hasRole,
        canAccess,
        canPerform,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
