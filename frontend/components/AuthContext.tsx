'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { isSquad, type Squad } from '@/lib/squads';

// Tipos

export type UserRole = 'medico' | 'gps' | 'admin';

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  squad: Squad;
}

interface AuthContextValor {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  //  Verifica si el usuario tiene alguno de los roles indicados
  hasRole: (...roles: UserRole[]) => boolean;
  //  Verifica si el usuario actual puede acceder a una pagina
  canAccess: (page: AppPage) => boolean;
  //  Verifica si el usuario actual puede realizar una accion
  canPerform: (action: AppAction) => boolean;
  activeSquad: Squad | null;
  canSwitchSquad: boolean;
  setActiveSquad: (squad: Squad) => void;
}

// Paginas y acciones

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

// Matriz de permisos

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

// Contexto

const AuthContext = createContext<AuthContextValor | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSquad, setActiveSquadState] = useState<Squad | null>(null);

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
        setActiveSquadState(data.activeSquad as Squad);
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

  const setActiveSquad = useCallback((squad: Squad) => {
    if (user?.role !== 'admin' || !isSquad(squad)) return;
    document.cookie = `active_squad=${squad}; path=/; max-age=2592000; SameSite=Lax`;
    setActiveSquadState(squad);
    window.location.reload();
  }, [user]);

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
        activeSquad,
        canSwitchSquad: user?.role === 'admin',
        setActiveSquad,
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
