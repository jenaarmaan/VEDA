'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-56px)] bg-gray-50">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 sm:text-6xl">
          Welcome to VEDHA
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
          Your partner in combating misinformation.
        </p>
      </div>

      <div className="w-full max-w-md space-y-4">
        <Link href="/signup" passHref>
          <Card className="hover:shadow-lg hover:border-primary transition-all duration-200 cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Sign Up</CardTitle>
                <CardDescription>Create a new account to get started.</CardDescription>
              </div>
              <ArrowRight className="text-gray-400" />
            </CardHeader>
          </Card>
        </Link>
        
        <Link href="/login" passHref>
          <Card className="hover:shadow-lg hover:border-primary transition-all duration-200 cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Sign In</CardTitle>
                <CardDescription>Access your existing account dashboard.</CardDescription>
              </div>
              <ArrowRight className="text-gray-400" />
            </CardHeader>
          </Card>
        </Link>
        
        <Link href="/documentation" passHref>
          <Card className="hover:shadow-lg hover:border-primary transition-all duration-200 cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Documentation</CardTitle>
                <CardDescription>Learn more about VEDHA's features.</CardDescription>
              </div>
              <ArrowRight className="text-gray-400" />
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
}
