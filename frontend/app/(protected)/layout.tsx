'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { NavBar } from '@/components/nav-bar';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-white/10 border-t-violet-500 rounded-full animate-spin" />
          <p className="text-neutral-600 text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col">
      <NavBar />
      <main className="flex-1">{children}</main>
    </div>
  );
}
