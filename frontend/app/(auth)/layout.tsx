'use client';

import { ProtectedLayout } from '@/components/ProtectedLayout';
import Sidebar from '@/components/Sidebar';

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ProtectedLayout>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto overflow-x-hidden pb-16 md:pb-0 w-full min-w-0">
          {children}
        </main>
      </div>
    </ProtectedLayout>
  );
}
