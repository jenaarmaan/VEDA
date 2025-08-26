'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-56px)] bg-background">
      <div className="text-center mb-12 px-4">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
          Welcome to VEDA
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-xl text-muted-foreground">
          Your partner in combating misinformation.
        </p>
      </div>

      <div className="w-full max-w-md space-y-4">
        <Link href="/signup" passHref>
          <Card className="hover:shadow-lg hover:border-primary/50 transition-all duration-200 cursor-pointer bg-card/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Sign Up</CardTitle>
                <CardDescription>Create a new account to get started.</CardDescription>
              </div>
              <ArrowRight className="text-muted-foreground" />
            </CardHeader>
          </Card>
        </Link>
        
        <Link href="/login" passHref>
          <Card className="hover:shadow-lg hover:border-primary/50 transition-all duration-200 cursor-pointer bg-card/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Sign In</CardTitle>
                <CardDescription>Access your existing account dashboard.</CardDescription>
              </div>
              <ArrowRight className="text-muted-foreground" />
            </CardHeader>
          </Card>
        </Link>
        
        <Link href="/about" passHref>
          <Card className="hover:shadow-lg hover:border-primary/50 transition-all duration-200 cursor-pointer bg-card/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>About</CardTitle>
                <CardDescription>Learn more about VEDA's features.</CardDescription>
              </div>
              <ArrowRight className="text-muted-foreground" />
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
}
