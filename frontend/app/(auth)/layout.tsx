'use client';

import { ProtectedLayout } from '@/components/ProtectedLayout';
import { AuthProvider } from '@/components/AuthContext';
import Sidebar from '@/components/Sidebar';

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ProtectedLayout>
      <AuthProvider>
        <div className="flex h-dvh overflow-hidden">
          <Sidebar />
          <main className="w-full min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">
            {children}
          </main>
        </div>
      </AuthProvider>
    </ProtectedLayout>
  );
}
