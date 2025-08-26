'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Spinner from '@/components/shared/Spinner';
import type { UserProfile } from '@/lib/types';

const getDashboardPath = (role: UserProfile['role']) => {
  switch (role) {
    case 'general_user':
      return '/dashboard/user';
    case 'govt_admin':
      return '/dashboard/admin';
    case 'agency_head':
      return '/dashboard/agency-head';
    case 'agency_employee':
      return '/dashboard/agency-employee';
    default:
      return '/login';
  }
};

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user && user.role) {
        const path = getDashboardPath(user.role);
        router.replace(path);
      } else {
        router.replace('/login');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="flex h-[calc(100vh-56px)] items-center justify-center">
      <Spinner />
    </div>
  );
}
