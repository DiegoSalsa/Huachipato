import { useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // Obtener token desde cookies
        const tokenMatch = document.cookie.match(/(?:^|; )auth_token=([^;]*)/);
        const token = tokenMatch ? tokenMatch[1] : null;

        if (!token) {
          setUser(null);
          setLoading(false);
          return;
        }

        const response = await fetch('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          setUser(null);
          // Limpiar cookie
          document.cookie = 'auth_token=; path=/; max-age=0';
          return;
        }

        const data = await response.json();
        setUser(data.user);
      } catch (err) {
        console.error('Error fetching user:', err);
        setError('Error al obtener usuario');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const logout = async () => {
    try {
      const tokenMatch = document.cookie.match(/(?:^|; )auth_token=([^;]*)/);
      const token = tokenMatch ? tokenMatch[1] : null;

      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      // Limpiar cookies
      document.cookie = 'auth_token=; path=/; max-age=0';
      document.cookie = 'rememberMe=; path=/; max-age=0';
      setUser(null);
      window.location.href = '/login';
    }
  };

  return {
    user,
    loading,
    error,
    logout,
    isAuthenticated: !!user,
  };
}
