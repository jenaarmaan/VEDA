
'use client';

import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { VedhaIcon } from '../icons/VedhaIcon';

export default function Header() {
  const { user } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex items-center">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <VedhaIcon className="h-6 w-6" />
            <span className="font-bold sm:inline-block">
              VEDA
            </span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <nav className="flex items-center gap-4">
             <Link href="/about" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                About
            </Link>
            {user ? (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/dashboard/user">Dashboard</Link>
                </Button>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </>
            ) : (
                <>
                    <Button asChild size="sm">
                        <Link href="/login">Sign In</Link>
                    </Button>
                </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
