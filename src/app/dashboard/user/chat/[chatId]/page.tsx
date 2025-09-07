
'use client';

import React, { useEffect, useState, useRef, createContext, useContext, use } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Plus,
  Mic,
  ArrowUp,
  Settings,
  BookOpen,
  History,
  ThumbsUp,
  ThumbsDown,
  Share2,
  Copy,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  AlertTriangle,
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { type VerificationReport } from '@/lib/types';
import { verifyContentAndRecord } from '@/ai/flows/orchestrationFlow';
import { doc, onSnapshot, updateDoc, arrayUnion, collection, query, orderBy, getDoc, serverTimestamp, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { VerificationHistory } from '@/lib/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type View = 'chat' | 'learn' | 'recent';

const DashboardViewContext = createContext<{ view: View; setView: React.Dispatch<React.SetStateAction<View>> } | null>(null);

function useDashboardView() {
  const context = useContext(DashboardViewContext);
  if (!context) {
    throw new Error('useDashboardView must be used within a DashboardViewProvider');
  }
  return context;
}

// Re-usable Sidebar from the main dashboard page
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
      setHistory(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VerificationHistory)));
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  if (loading) return <div className="p-4 text-center"><Spinner /></div>;
  if (history.length === 0) return <p className={cn("p-4 text-xs text-muted-foreground text-center", state === "collapsed" && "hidden")}>No recent activity.</p>;

  return (
    <div className={cn("px-2 space-y-1", state === "collapsed" && "hidden")}>
      {history.map(item => (
        <Link href={`/dashboard/user/chat/${item.id}`} key={item.id} className="block text-sm p-2 rounded-md hover:bg-sidebar-accent truncate text-muted-foreground cursor-pointer">
          {item.title}
        </Link>
      ))}
    </div>
  );
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


export default function ChatPage({ params }: { params: { chatId: string } }) {
  const { chatId } = use(params);
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [view, setView] = useState<View>('chat');
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [chatHistory, setChatHistory] = useState<VerificationHistory | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory?.messages]);
  
  // Fetch chat history and listen for updates
  useEffect(() => {
    if (!user || !chatId) return;
    setIsPageLoading(true);
    const chatDocRef = doc(db, 'users', user.uid, 'verificationHistory', chatId);
    const unsubscribe = onSnapshot(chatDocRef, (doc) => {
      if (doc.exists()) {
        const data = { id: doc.id, ...doc.data() } as VerificationHistory;
        setChatHistory(data);

        // If this is the first time loading this chat, and there is only one message (the user's),
        // then trigger the AI analysis automatically.
        if (data.messages.length === 1 && data.messages[0].role === 'user') {
          handleSendMessage(data.messages[0].content as string, true);
        }

      } else {
        toast({ variant: 'destructive', title: 'Chat not found.' });
        router.push('/dashboard/user');
      }
      setIsPageLoading(false);
    }, (error) => {
        toast({ variant: 'destructive', title: 'Error loading chat', description: error.message });
        router.push('/dashboard/user');
        setIsPageLoading(false);
    });

    return () => unsubscribe();
  }, [user, chatId, router, toast]);

  const handleSendMessage = async (content: string, isInitialMessage = false) => {
      if (!content.trim() || !user) return;
      
      setIsLoading(true);
      
      if (!isInitialMessage) {
        setInputValue('');
      }

      try {
        await verifyContentAndRecord({
            userId: user.uid,
            content: content,
            contentType: 'unknown',
            metadata: { source: 'user_input' },
            chatId: chatId,
        });
      } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Analysis Failed',
            description: error.message || 'Could not verify the content. Please try again.',
        });
        const chatDocRef = doc(db, 'users', user.uid, 'verificationHistory', chatId);
        await updateDoc(chatDocRef, {
            messages: arrayUnion({ role: 'assistant', content: { error: error.message } }),
        });
      } finally {
        setIsLoading(false);
      }
  };

  const getVerdictBadge = (verdict: VerificationReport['verdict']) => {
    switch(verdict) {
      case 'True': return <Badge variant="default" className="bg-green-600 hover:bg-green-700"><CheckCircle className="mr-2 h-4 w-4" />True</Badge>;
      case 'False': return <Badge variant="destructive"><XCircle className="mr-2 h-4 w-4" />False</Badge>;
      case 'Suspicious': return <Badge variant="destructive" className="bg-orange-500 hover:bg-orange-600"><AlertTriangle className="mr-2 h-4 w-4" />Suspicious</Badge>;
      default: return <Badge variant="secondary" className="bg-yellow-500 hover:bg-yellow-600 text-black"><AlertTriangle className="mr-2 h-4 w-4" />Unverifiable</Badge>;
    }
  };

  if (isPageLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#131314]">
        <Spinner />
      </div>
    );
  }

  return (
    <SidebarProvider>
     <DashboardViewContext.Provider value={{ view, setView }}>
      <div className="flex h-screen bg-[#131314] text-gray-200">
        <Sidebar>
          <DashboardSidebarContent />
        </Sidebar>
        <main className="flex-1 flex flex-col h-screen">
          <div className="flex-1 p-6 overflow-y-auto flex flex-col">
            <div className="w-full flex-1 max-w-4xl mx-auto space-y-6">
              {chatHistory?.messages?.map((msg, index) => (
                <div key={index}>
                  {msg.role === 'user' && (
                    <div className="p-4 bg-card/50 rounded-lg">
                      <p className="font-semibold mb-2">You:</p>
                      <p>{msg.content as string}</p>
                    </div>
                  )}
                  {msg.role === 'assistant' && (
                    <div>
                      {(msg.content as VerificationReport).verdict ? (
                          <Card className="bg-card/80">
                            <CardHeader className="flex flex-row justify-between items-center">
                                <CardTitle>Verification Result</CardTitle>
                                {getVerdictBadge((msg.content as VerificationReport).verdict)}
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <h3 className="font-semibold mb-1">Explanation</h3>
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{(msg.content as VerificationReport).explanation}</p>
                                </div>
                                 <div>
                                    <h3 className="font-semibold mb-1">Sources</h3>
                                    <ul className="list-disc pl-5 text-sm">
                                        {(msg.content as VerificationReport).sources.map((src, i) => (
                                          <li key={i}>
                                            <a href={src} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                              {src}
                                            </a>
                                          </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="flex items-center gap-2 pt-4 border-t border-border">
                                   <Button variant="ghost" size="icon"><ThumbsUp className="h-4 w-4" /></Button>
                                   <Button variant="ghost" size="icon"><ThumbsDown className="h-4 w-4" /></Button>
                                   <Button variant="ghost" size="icon"><Share2 className="h-4 w-4" /></Button>
                                   <Button variant="ghost" size="icon"><Copy className="h-4 w-4" /></Button>
                                   <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                </div>
                            </CardContent>
                         </Card>
                      ) : (msg.content as any).error ? (
                         <div className="p-4 bg-destructive/20 text-destructive-foreground rounded-lg">
                           <p className="font-semibold mb-1">VEDA:</p>
                           <p>Sorry, an error occurred: {(msg.content as any).error}</p>
                         </div>
                      ): null}
                    </div>
                  )}
                </div>
              ))}
              {isLoading && <div className="flex justify-center p-4"><Spinner /></div>}
              <div ref={chatEndRef} />
            </div>

             <div className="w-full mt-auto pt-4 max-w-4xl mx-auto">
                <div className="w-full mx-auto px-4 py-2 bg-[#1e1f20] rounded-full flex items-center gap-2 border border-gray-700 focus-within:ring-2 focus-within:ring-primary transition-shadow">
                    <Button variant="ghost" size="icon" className="text-gray-400 hover:bg-gray-700 rounded-full">
                        <Plus />
                    </Button>
                    <Input
                        placeholder="Ask a follow-up..."
                        className="flex-1 bg-transparent border-none text-lg text-gray-200 placeholder-gray-500 focus:ring-0 focus:outline-none"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(inputValue)}
                        disabled={isLoading}
                    />
                    <Button variant="ghost" size="icon" className="text-gray-400 hover:bg-gray-700 rounded-full">
                        <Mic />
                    </Button>
                    <Button size="icon" className="bg-gray-700 hover:bg-gray-600 rounded-full" onClick={() => handleSendMessage(inputValue)} disabled={isLoading || !inputValue.trim()}>
                        {isLoading ? <Spinner /> : <ArrowUp />}
                    </Button>
                </div>
                 <p className="text-xs text-gray-500 mt-2 text-center">
                    VEDA may display inaccurate info. Always verify important information.
                </p>
             </div>
          </div>
        </main>
      </div>
      </DashboardViewContext.Provider>
    </SidebarProvider>
  );
}
