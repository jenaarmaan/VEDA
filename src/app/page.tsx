

'use client';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { Menu, Plus, Mic, Settings } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { VedhaIcon } from '@/components/icons/VedhaIcon';

export default function LandingPage() {
  const [inputValue, setInputValue] = useState('');
  const router = useRouter();
  const { user } = useAuth();

  const handleGoClick = () => {
    if (user) {
      // If user is logged in, navigate to the report page with the content
      router.push(`/report/new?contentType=text&contentData=${encodeURIComponent(inputValue)}`);
    } else {
      // If user is not logged in, navigate to login
      router.push('/login');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#131314] text-gray-200 font-sans">
      {/* Top Navigation Bar */}
      <header className="flex justify-between items-center p-4">
        <div className="flex items-center space-x-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-gray-400 hover:bg-gray-800 hover:text-white">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="bg-[#1e1f20] text-white border-gray-700 w-[280px] p-0 flex flex-col">
               <div className="p-4 border-b border-gray-700 flex items-center justify-center gap-2">
                 <VedhaIcon className="h-6 w-6" />
                 <h2 className="text-xl font-bold">VEDA</h2>
               </div>
               <div className="flex-grow">
                 {/* Future sidebar links can go here */}
               </div>
               <div className="p-4 border-t border-gray-700">
                  <Button variant="ghost" className="w-full justify-start space-x-2 text-gray-300 hover:bg-gray-700">
                    <Settings className="h-5 w-5" />
                    <span>Settings</span>
                  </Button>
               </div>
            </SheetContent>
          </Sheet>
          <VedhaIcon className="h-6 w-6" />
          <span className="text-xl font-bold">VEDA</span>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="link" asChild className="text-gray-300 hover:text-white">
            <Link href="/about">About</Link>
          </Button>
          <Button asChild className="bg-blue-600 text-white hover:bg-blue-700 rounded-md">
            <Link href="/login">Login / Signup</Link>
          </Button>
        </div>
      </header>

      {/* Main Center Section */}
      <main className="flex-grow flex flex-col items-center justify-center text-center px-4 -mt-14">
        <h1 className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
          Meet Veda
        </h1>
        <p className="mt-4 text-xl md:text-2xl text-gray-400">
          Built on Truth, Powered by AI
        </p>

        <div className="w-full max-w-2xl lg:max-w-4xl mt-12">
          <div className="relative flex items-center bg-[#1e1f20] rounded-full shadow-lg p-2">
            <Button variant="ghost" size="icon" className="text-gray-400 hover:bg-gray-700 rounded-full">
              <Plus className="h-6 w-6" />
              <span className="sr-only">Upload file</span>
            </Button>
            <Input
              type="text"
              placeholder="Paste news, article, or text to verify..."
              className="flex-grow bg-transparent border-none text-lg text-gray-200 placeholder-gray-500 focus:ring-0 focus:outline-none"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleGoClick()}
            />
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="icon" className="text-gray-400 hover:bg-gray-700 rounded-full">
                <Mic className="h-6 w-6" />
                <span className="sr-only">Use microphone</span>
              </Button>
               {inputValue && (
                <Button 
                    onClick={handleGoClick}
                    className="bg-blue-600 text-white hover:bg-blue-700 rounded-full px-6 py-3 text-lg"
                >
                  Go
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
