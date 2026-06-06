'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import HuachipatoLoader from '@/components/HuachipatoLoader';

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

export function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay token en cookies
    const tokenMatch = document.cookie.match(/(?:^|; )auth_token=([^;]*)/);
    const token = tokenMatch ? tokenMatch[1] : null;

    if (!token) {
      router.push('/login');
      return;
    }

    // Verificar que el token sea válido con el servidor
    fetch('/api/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error('Invalid token');
        }
        setIsAuthenticated(true);
      })
      .catch(() => {
        document.cookie = 'auth_token=; path=/; max-age=0';
        router.push('/login');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <HuachipatoLoader />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
