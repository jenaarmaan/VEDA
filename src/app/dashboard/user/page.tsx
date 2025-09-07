
'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { SpotlightItem, VerificationHistory, ChatMessage } from '@/lib/types';
import {
  Plus,
  Mic,
  ArrowUp,
  Settings,
  BookOpen,
  History,
} from 'lucide-react';
import Spinner from '@/components/shared/Spinner';
import { Input } from '@/components/ui/input';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import SpotlightCard from '@/components/dashboard/SpotlightCard';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

type View = 'chat' | 'learn' | 'recent';

function RecentItemsList() {
  const { user } = useAuth();
  const [history, setHistory] = useState<VerificationHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const { state } = useSidebar();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const historyRef = collection(db, 'users', user.uid, 'verificationHistory');
    const q = query(historyRef, orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const userHistory = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as VerificationHistory));
      setHistory(userHistory);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching history: ', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (loading) {
    return <div className="p-4 text-center"><Spinner /></div>;
  }
  
  if (history.length === 0) {
     return <p className={cn("p-4 text-xs text-muted-foreground text-center", state === "collapsed" && "hidden")}>No recent activity.</p>
  }

  return (
    <div className={cn("px-2 space-y-1", state === "collapsed" && "hidden")}>
      {history.map(item => (
         <Link href={`/dashboard/user/chat/${item.id}`} key={item.id} className="block text-sm p-2 rounded-md hover:bg-sidebar-accent truncate text-muted-foreground cursor-pointer">
           {item.title}
         </Link>
      ))}
    </div>
  )
}


function DashboardSidebarContent() {
  const { view, setView } = useDashboardView();
  const { state } = useSidebar();
  const [showRecent, setShowRecent] = useState(true);

  return (
    <>
      <SidebarHeader />
      <SidebarContent className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
             <SidebarMenuButton asChild tooltip="New Verification">
                <Link href="/dashboard/user" className="w-full justify-start text-base h-12">
                    <Plus className="h-5 w-5" />
                    <span className={cn(state === "collapsed" && "hidden")}>New Verification</span>
                </Link>
             </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => setView('learn')} isActive={view === 'learn'} tooltip="Learn">
              <BookOpen />
               <span className={cn(state === "collapsed" && "hidden")}>Learn</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem className="flex flex-col items-start">
             <SidebarMenuButton onClick={() => setShowRecent(!showRecent)} isActive={view === 'recent'} className="w-full" tooltip="Recent">
              <History />
              <span className={cn(state === "collapsed" && "hidden")}>Recent</span>
            </SidebarMenuButton>
            {showRecent && <RecentItemsList />}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Settings">
              <Settings />
               <span className={cn(state === "collapsed" && "hidden")}>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}

const DashboardViewContext = React.createContext<{ view: View; setView: React.Dispatch<React.SetStateAction<View>> } | null>(null);

function useDashboardView() {
  const context = React.useContext(DashboardViewContext);
  if (!context) {
    throw new Error('useDashboardView must be used within a DashboardViewProvider');
  }
  return context;
}

export default function GeneralUserDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [view, setView] = useState<View>('chat');
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [spotlightNews, setSpotlightNews] = useState<SpotlightItem[]>([
    { type: 'real', title: 'Scientists Discover Breakthrough in Renewable Energy', summary: 'A new solar panel technology promises to double efficiency rates...', source: 'Science Today', verdict: 'True' },
    { type: 'fake', title: 'Warning: Viral Video Falsely Claims New Tax Law', summary: 'A widely circulated video is using deceptive edits to spread misinformation...', source: 'Internal Alert', verdict: 'Fake' },
    { type: 'real', title: 'Global Economic Summit Concludes with New Trade Agreements', summary: 'Leaders from 20 nations signed new pacts to promote fair trade...', source: 'Global Times', verdict: 'True' },
  ]);

  const handleNewChat = async () => {
    if (!inputValue.trim() || !user) return;
    setIsLoading(true);
    const tempInputValue = inputValue;
    setInputValue('');

    try {
      const historyCollectionRef = collection(db, 'users', user.uid, 'verificationHistory');
      
      const firstMessage: ChatMessage = {
        role: 'user',
        content: tempInputValue,
      };

      const newDocRef = await addDoc(historyCollectionRef, {
        title: "New Query", // Placeholder title
        query: tempInputValue,
        report: null,
        timestamp: serverTimestamp(),
        messages: [firstMessage],
      });

      // Redirect to the newly created chat page.
      router.push(`/dashboard/user/chat/${newDocRef.id}`);

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to Start Chat',
        description: error.message || 'Could not create a new verification session. Please check your connection and permissions.',
      });
      setIsLoading(false);
    } 
    // No finally block to set isLoading false, because we are redirecting away.
  };

  const renderMainContent = () => {
    switch (view) {
      case 'learn':
        return (
          <div className="w-full">
            <h2 className="text-3xl font-bold text-center mb-8">Knowledge Hub</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { title: "Identifying Fake News", description: "Learn the common signs of misinformation." },
                { title: "Source Verification 101", description: "How to check if a source is credible." },
                { title: "Understanding Deepfakes", description: "An interactive guide to synthetic media." },
                { title: "Quiz: Are You a Fact-Checker?", description: "Test your skills in spotting fake content." },
              ].map(item => (
                <Card key={item.title} className="bg-card/80 hover:bg-card/100 transition-colors">
                  <CardHeader>
                    <CardTitle>{item.title}</CardTitle>
                    <CardDescription>{item.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button>Start Learning</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      case 'recent':
      case 'chat':
      default:
        return (
          <div className="w-full flex flex-col items-center h-full">
            <div className="flex-grow w-full flex flex-col items-center justify-center">
              <div className="text-center">
                <h1 className="text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 mb-4">
                  Namaste, Welcome to VEDA
                </h1>
                <p className="text-lg text-muted-foreground">Your personal assistant for verified information</p>
              </div>
            </div>

             <div className="w-full mt-auto mb-4">
                <div className="w-full max-w-4xl mx-auto px-4 py-2 bg-[#1e1f20] rounded-full flex items-center gap-2 border border-gray-700 focus-within:ring-2 focus-within:ring-primary transition-shadow">
                    <Button variant="ghost" size="icon" className="text-gray-400 hover:bg-gray-700 rounded-full">
                        <Plus />
                    </Button>
                    <Input
                        placeholder="Ask VEDA or paste content to verify..."
                        className="flex-1 bg-transparent border-none text-lg text-gray-200 placeholder-gray-500 focus:ring-0 focus:outline-none"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleNewChat()}
                        disabled={isLoading}
                    />
                    <Button variant="ghost" size="icon" className="text-gray-400 hover:bg-gray-700 rounded-full">
                        <Mic />
                    </Button>
                    <Button size="icon" className="bg-gray-700 hover:bg-gray-600 rounded-full" onClick={handleNewChat} disabled={isLoading || !inputValue.trim()}>
                        {isLoading ? <Spinner /> : <ArrowUp />}
                    </Button>
                </div>
                 <p className="text-xs text-gray-500 mt-2 text-center">
                    VEDA may display inaccurate info. Always verify important information.
                </p>
             </div>
             <div className="w-full mt-8">
                <h2 className="text-2xl font-bold text-center mb-6">Spotlight</h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {spotlightNews.map((item, index) => <SpotlightCard key={index} item={item} />)}
                </div>
            </div>
          </div>
        );
    }
  };

  return (
    <SidebarProvider>
      <DashboardViewContext.Provider value={{ view, setView }}>
        <div className="flex h-screen bg-[#131314] text-gray-200">
          <Sidebar>
            <DashboardSidebarContent />
          </Sidebar>

          <main className="flex-1 flex flex-col overflow-y-auto">
            <div className="flex-1 p-6 flex items-center justify-center">
              {renderMainContent()}
            </div>
          </main>
        </div>
      </DashboardViewContext.Provider>
    </SidebarProvider>
  );
}
