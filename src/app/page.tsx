

'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { Plus, Mic } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

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
      {/* Main Center Section */}
      <main className="flex-grow flex flex-col items-center justify-center text-center px-4">
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
