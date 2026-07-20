'use client';

import { useAuth, UserRole } from '@/components/AuthContext';
import Link from 'next/link';

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}

export default function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { user, loading, hasRole } = useAuth();

  if (loading) return null;

  if (!user || !hasRole(...allowedRoles)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <div className="w-20 h-20 rounded-full bg-rose-50 flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-4xl text-rose-500">
            lock
          </span>
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">
          Acceso Restringido
        </h2>
        <p className="text-sm text-slate-500 max-w-md mb-8">
          No tienes permisos para acceder a esta sección. Contacta al administrador si
          crees que esto es un error.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-[#0085CB] px-6 py-3 text-sm font-bold text-white transition-all hover:opacity-90"
        >
          <span className="material-symbols-outlined text-base">home</span>
          Volver al Inicio
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
