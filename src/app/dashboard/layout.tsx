'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Spinner from '@/components/shared/Spinner';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

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
        'ground_sentinel': '/dashboard/ground-sentinel',
        'council': '/dashboard/council'
    };
    
    const targetRoute = dashboardRoutes[user.role];

    if (targetRoute && window.location.pathname !== targetRoute) {
        router.replace(targetRoute);
    }

  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex h-[calc(100vh-56px)] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return <>{children}</>;
}
