

'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Mic, ArrowUp } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function LandingPage() {
  const [inputValue, setInputValue] = useState('');
  const router = useRouter();
  const { user } = useAuth();

  const handleGoClick = () => {
    if (user) {
      router.push(`/report/new?contentType=text&contentData=${encodeURIComponent(inputValue)}`);
    } else {
      router.push('/login');
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-57px)] bg-[#131314] text-gray-200 font-sans">
      <main className="flex-grow flex flex-col items-center justify-center text-center p-4">
        <div className="flex-grow flex flex-col items-center justify-center">
            <h1 className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            Meet Veda
            </h1>
            <p className="mt-4 text-xl md:text-2xl text-gray-400">
            Built on Truth, Powered by AI
            </p>
        </div>

        <div className="w-full max-w-4xl px-4 py-2 bg-[#1e1f20] rounded-full flex items-center gap-2">
            <Button variant="ghost" size="icon" className="text-gray-400 hover:bg-gray-700 rounded-full">
                <Plus />
            </Button>
            <Input 
                placeholder="Paste news, article, or text to verify..."
                className="flex-1 bg-transparent border-none text-lg text-gray-200 placeholder-gray-500 focus:ring-0 focus:outline-none"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && inputValue && handleGoClick()}
            />
            <Button variant="ghost" size="icon" className="text-gray-400 hover:bg-gray-700 rounded-full">
                <Mic />
            </Button>
            <Button 
                size="icon" 
                className="bg-gray-700 hover:bg-gray-600 rounded-full"
                onClick={handleGoClick}
                disabled={!inputValue}
            >
                <ArrowUp />
            </Button>
        </div>
        <p className="text-xs text-gray-500 mt-2">VEDA may display inaccurate info. Always verify important information.</p>
      </main>
    </div>
  );
}
