'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Spinner from '@/components/shared/Spinner';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) {
      return;
    }
    if (!user) {
      router.replace('/login');
      return;
    }
    
    // Role-based redirection
    const dashboardRoutes: { [key: string]: string } = {
        'civic': '/dashboard/user',
        'sentinel': '/dashboard/sentinel',
        'ground-sentinel': '/dashboard/ground-sentinel',
        'council': '/dashboard/council',
        'state-officer': '/dashboard/state-officer',
        'govt-admin': '/dashboard/govt-admin',
    };
    
    const targetRoute = dashboardRoutes[user.role];

    // Redirect only if the user is not already on their correct dashboard path
    if (targetRoute && !pathname.startsWith(targetRoute)) {
        router.replace(targetRoute);
    }

  }, [user, loading, router, pathname]);

  if (loading || !user) {
    return (
      <div className="flex h-[calc(100vh-56px)] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return <>{children}</>;
}
