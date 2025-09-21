
'use client';

import React, { useEffect, useState, createContext, useContext } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { SpotlightItem, VerificationHistory, ChatMessage, AnalyzeContentOutput } from '@/lib/types';
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
  Mail,
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import SpotlightCard from '@/components/dashboard/SpotlightCard';
import { cn } from '@/lib/utils';
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

// --- Dummy Response Generator ---
const generateRandomResponse = (): AnalyzeContentOutput => {
  const verdicts: AnalyzeContentOutput['status'][] = ['Verified', 'False', 'Questionable', 'Unverified'];
  const randomVerdict = verdicts[Math.floor(Math.random() * verdicts.length)];
  const randomConfidence = Math.floor(Math.random() * 40) + 60; // 60-100%

  let explanation = '';
  let contentDescription = 'the viral claim';

  switch (randomVerdict) {
    case 'Verified':
      explanation = `The claims have been corroborated by multiple reliable sources, including mainstream news outlets and official statements. Cross-verification confirms the sequence of events and reported facts. Analysis shows no signs of manipulation.`;
      break;
    case 'False':
      explanation = `This claim was fact-checked and proven false by multiple independent organizations. The original source was found to be a satirical website, and the information was taken out of context. Official sources have directly refuted this claim.`;
      break;
    case 'Questionable':
      explanation = `The content contains a mix of accurate and unverified information, making it potentially misleading. While some facts are correct, the overall narrative is biased and lacks credible sources for its main claims. Caution is advised.`;
      break;
    case 'Unverified':
      explanation = `There is insufficient credible evidence to either confirm or deny the claims made in this content. The story originates from a single, uncorroborated source with no history of reliable reporting. More information is needed for a conclusive verdict.`;
      break;
  }
  
  return {
      status: randomVerdict,
      confidence: randomConfidence,
      explanation: explanation,
      draftEmail: {
          subject: "Fact-check report from VEDA",
          body: `Dear Sir/Madam,\n\nWe are writing to report potentially misleading information circulating online regarding ${contentDescription}. Our analysis indicates the content is ${randomVerdict.toLowerCase()}.\n\n${explanation}\n\nWe request that you review this matter and take appropriate action.\n\nThank you,\nVEDA Fact-Checking Team`
      }
    };
}


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
             <SidebarMenuButton asChild tooltip="New Chat">
                <Link href="/dashboard/user" className="h-12 text-base">
                    <Plus className="h-5 w-5" />
                    New Chat
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

// --- Chat View Components ---
const getVerdictBadge = (verdict: AnalyzeContentOutput['status']) => {
    switch(verdict) {
      case 'Verified': return <Badge variant="default" className="bg-green-600 hover:bg-green-700"><CheckCircle className="mr-2 h-4 w-4" />Verified</Badge>;
      case 'False': return <Badge variant="destructive"><XCircle className="mr-2 h-4 w-4" />False</Badge>;
      case 'Questionable': return <Badge variant="destructive" className="bg-orange-500 hover:bg-orange-600"><AlertTriangle className="mr-2 h-4 w-4" />Questionable</Badge>;
      default: return <Badge variant="secondary" className="bg-yellow-500 hover:bg-yellow-600 text-black"><AlertTriangle className="mr-2 h-4 w-4" />Unverified</Badge>;
    }
  };

const isAnalyzeContentOutput = (content: any): content is AnalyzeContentOutput => {
      return content && typeof content === 'object' && 'status' in content && 'confidence' in content && 'explanation' in content;
}

function SimulatedChatView({ messages, onNewQuery }: { messages: ChatMessage[], onNewQuery: () => void }) {
    const chatEndRef = React.useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div className="w-full flex-1 max-w-4xl mx-auto space-y-6 overflow-y-auto p-4">
             {messages.map((msg, index) => (
                <div key={index}>
                  {msg.role === 'user' && (
                    <div className="p-4 bg-card/50 rounded-lg">
                      <p className="font-semibold mb-2">You:</p>
                      <p>{msg.content as string}</p>
                    </div>
                  )}
                  {msg.role === 'assistant' && (
                    <div>
                      {isAnalyzeContentOutput(msg.content) ? (
                          <Card className="bg-card/80">
                            <CardHeader className="flex flex-row justify-between items-center">
                                <CardTitle>Verification Result</CardTitle>
                                {getVerdictBadge((msg.content as AnalyzeContentOutput).status)}
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <h3 className="font-semibold mb-1">Explanation</h3>
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{(msg.content as AnalyzeContentOutput).explanation}</p>
                                </div>
                                <div className="flex items-center gap-2 pt-4 border-t border-border">
                                   <Button variant="ghost" size="icon"><ThumbsUp className="h-4 w-4" /></Button>
                                   <Button variant="ghost" size="icon"><ThumbsDown className="h-4 w-4" /></Button>
                                   <Button variant="ghost" size="icon"><Share2 className="h-4 w-4" /></Button>
                                   <Button variant="ghost" size="icon"><Copy className="h-4 w-4" /></Button>
                                   <a
                                    href={`mailto:veda.agencyhead@gmail.com?cc=${encodeURIComponent('veda.govt@gmail.com,contact.vedaofficial@gmail.com')}&subject=${encodeURIComponent(
                                      (msg.content as AnalyzeContentOutput).draftEmail.subject
                                    )}&body=${encodeURIComponent(
                                      (msg.content as AnalyzeContentOutput).draftEmail.body
                                    )}`}
                                  >
                                    <Button variant="ghost" size="icon">
                                      <Mail className="h-4 w-4" />
                                    </Button>
                                  </a>
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
              <div ref={chatEndRef} />
              <Button onClick={onNewQuery} className="mt-4">Start New Chat</Button>
        </div>
    )
}


export default function GeneralUserDashboard() {
  const { user } = useAuth();
  const [view, setView] = useState<View>('chat');
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  const [spotlightNews, setSpotlightNews] = useState<SpotlightItem[]>([
    { type: 'real', title: 'Scientists Discover Breakthrough in Renewable Energy', summary: 'A new solar panel technology promises to double efficiency rates...', source: 'Science Today', verdict: 'True' },
    { type: 'fake', title: 'Warning: Viral Video Falsely Claims New Tax Law', summary: 'A widely circulated video is using deceptive edits to spread misinformation...', source: 'Internal Alert', verdict: 'Fake' },
    { type: 'real', title: 'Global Economic Summit Concludes with New Trade Agreements', summary: 'Leaders from 20 nations signed new pacts to promote fair trade...', source: 'Global Times', verdict: 'True' },
  ]);

  const handleNewChat = async () => {
    if (!inputValue.trim()) return;
    setIsLoading(true);
    setInputValue('');

    // 1. Add user message
    const userMessage: ChatMessage = { role: 'user', content: inputValue };
    
    // 2. Generate random dummy response
    const dummyResponse = generateRandomResponse();
    const assistantMessage: ChatMessage = { role: 'assistant', content: dummyResponse };

    // 3. Update state to show the chat
    setChatMessages([userMessage, assistantMessage]);

    setIsLoading(false);
  };
  
  const resetChat = () => {
      setChatMessages([]);
      setInputValue('');
  }

  const renderMainContent = () => {
    if (chatMessages.length > 0) {
        return <SimulatedChatView messages={chatMessages} onNewQuery={resetChat} />;
    }

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
