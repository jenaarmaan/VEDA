
'use client';

import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut, User, LifeBuoy, MessageSquare } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { VedhaIcon } from '../icons/VedhaIcon';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                       <AvatarImage src={`https://i.pravatar.cc/150?u=${user.uid}`} alt={user.details.fullName} />
                       <AvatarFallback>{user.details.fullName?.[0]}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.details.fullName}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                   <DropdownMenuItem asChild>
                     <Link href="/dashboard/user"><User className="mr-2 h-4 w-4" />My Profile</Link>
                   </DropdownMenuItem>
                   <DropdownMenuItem asChild>
                     <Link href="/contact"><MessageSquare className="mr-2 h-4 w-4" />Contact Us</Link>
                   </DropdownMenuItem>
                   <DropdownMenuItem asChild>
                     <Link href="/help"><LifeBuoy className="mr-2 h-4 w-4" />Help</Link>
                   </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
