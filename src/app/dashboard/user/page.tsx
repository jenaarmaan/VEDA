
'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { collection, query, where, getDocs, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Report, SpotlightItem, VerificationHistory } from '@/lib/types';
import {
  Plus,
  Mic,
  ArrowUp,
  Settings,
  BookOpen,
  History,
  Info,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import SpotlightCard from '@/components/dashboard/SpotlightCard';
import { cn } from '@/lib/utils';
import { type UnifiedReport } from '@/ai/orchestration';
import { verifyContentAndRecord } from '@/ai/flows/orchestrationFlow';

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
         <div key={item.id} className="text-sm p-2 rounded-md hover:bg-sidebar-accent truncate text-muted-foreground cursor-pointer">
           {item.title}
         </div>
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
            <Button asChild variant="secondary" className="w-full justify-start text-base h-12">
              <Link href="/report/new">
                <Plus className="mr-2 h-5 w-5" />
                <span className={cn(state === "collapsed" && "hidden")}>New Verification</span>
              </Link>
            </Button>
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
  const [view, setView] = useState<View>('chat');
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<UnifiedReport | null>(null);
  const [spotlightNews, setSpotlightNews] = useState<SpotlightItem[]>([
    { type: 'real', title: 'Scientists Discover Breakthrough in Renewable Energy', summary: 'A new solar panel technology promises to double efficiency rates...', source: 'Science Today', verdict: 'True' },
    { type: 'fake', title: 'Warning: Viral Video Falsely Claims New Tax Law', summary: 'A widely circulated video is using deceptive edits to spread misinformation...', source: 'Internal Alert', verdict: 'Fake' },
    { type: 'real', title: 'Global Economic Summit Concludes with New Trade Agreements', summary: 'Leaders from 20 nations signed new pacts to promote fair trade...', source: 'Global Times', verdict: 'True' },
  ]);

  const handleAnalysis = async () => {
    if (!inputValue.trim() || !user) return;
    setIsLoading(true);
    setAnalysisResult(null);

    const originalQuery = inputValue;
    setInputValue('');

    try {
      const result = await verifyContentAndRecord({ 
        userId: user.uid,
        content: originalQuery,
        contentType: 'unknown', // Let the orchestrator decide
        metadata: { source: 'user_input' }
      });
      setAnalysisResult(result);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description: error.message || 'Could not verify the content. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleShareAndReport = (result: UnifiedReport) => {
    const subject = `Fake News Report: Claim regarding "${result.summary.substring(0, 50)}..."`;
    const body = `
      Dear VEDA Authorities,

      I am reporting the following piece of information flagged as 'Fake' by the VEDA system.

      Original Content:
      "${result.metadata.content}"

      AI Analysis Verdict: ${result.finalVerdict}
      Confidence: ${result.confidence}%

      Justification Provided:
      ${result.summary}

      Cited Sources:
      ${result.evidence.map(e => e.url).join('\n')}

      Please investigate this matter further.

      Regards,
      A Concerned Citizen
    `;
    const mailtoLink = `mailto:veda.agencyhead@gmail.com?cc=veda.govt@gmail.com,support.veda@gmail.com&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
  };
  
  const getVerdictBadge = (verdict: UnifiedReport['finalVerdict']) => {
    switch(verdict) {
      case 'verified_true': return <Badge variant="default" className="bg-green-600 hover:bg-green-700"><CheckCircle className="mr-2 h-4 w-4" />True</Badge>;
      case 'verified_false': return <Badge variant="destructive"><XCircle className="mr-2 h-4 w-4" />Fake</Badge>;
      case 'misleading': return <Badge variant="destructive" className="bg-orange-500 hover:bg-orange-600"><AlertTriangle className="mr-2 h-4 w-4" />Misleading</Badge>;
      case 'unverified':
      case 'insufficient_evidence': 
      default:
        return <Badge variant="secondary" className="bg-yellow-500 hover:bg-yellow-600 text-black"><AlertTriangle className="mr-2 h-4 w-4" />Suspicious</Badge>;
    }
  };

  const renderMainContent = () => {
    switch (view) {
      case 'learn':
        return (
          <div className="w-full max-w-5xl mx-auto">
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
          // This view is now handled inside the sidebar, so the main panel can revert to chat
      case 'chat':
      default:
        return (
          <div className="w-full mx-auto flex flex-col items-center flex-1 h-full">
            <div className="flex-grow w-full flex flex-col items-center justify-center">
              {!analysisResult && !isLoading && (
                <div className="text-center">
                  <h1 className="text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 mb-4">
                    Namaste, Welcome to VEDA
                  </h1>
                  <p className="text-lg text-muted-foreground">Your personal assistant for verified information</p>
                </div>
              )}
              {isLoading && <Spinner />}
              {analysisResult && (
                <div className="w-full max-w-4xl mb-8 space-y-4">
                   <Card className="bg-card/80">
                      <CardHeader className="flex flex-row justify-between items-center">
                          <CardTitle>Verification Result</CardTitle>
                          {getVerdictBadge(analysisResult.finalVerdict)}
                      </CardHeader>
                      <CardContent className="space-y-4">
                          <div>
                              <h3 className="font-semibold mb-1">Explanation</h3>
                              <p className="text-sm text-muted-foreground">{analysisResult.summary}</p>
                          </div>
                           <div>
                              <h3 className="font-semibold mb-1">Sources</h3>
                              <ul className="list-disc pl-5 text-sm">
                                  {analysisResult.evidence.map((src, i) => (
                                    <li key={i}>
                                      <a href={src.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                        {src.title}
                                      </a>
                                      <span className="text-muted-foreground text-xs ml-2">(Reliability: {Math.round(src.reliability * 100)}%)</span>
                                    </li>
                                  ))}
                              </ul>
                          </div>
                          <div className="flex items-center gap-2 pt-4 border-t border-border">
                             <Button variant="ghost" size="icon"><ThumbsUp className="h-4 w-4" /></Button>
                             <Button variant="ghost" size="icon"><ThumbsDown className="h-4 w-4" /></Button>
                             <Button variant="ghost" size="icon"><RefreshCw className="h-4 w-4" /></Button>
                             <Button variant="ghost" size="icon" onClick={() => analysisResult.finalVerdict === 'verified_false' && handleShareAndReport(analysisResult)}><Share2 className="h-4 w-4" /></Button>
                             <Button variant="ghost" size="icon"><Copy className="h-4 w-4" /></Button>
                             <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                          </div>
                      </CardContent>
                   </Card>
                </div>
              )}
            </div>

             <div className="w-full mt-auto mb-4 px-4">
                <div className="w-full mx-auto px-4 py-2 bg-[#1e1f20] rounded-full flex items-center gap-2 border border-gray-700 focus-within:ring-2 focus-within:ring-primary transition-shadow">
                    <Button variant="ghost" size="icon" className="text-gray-400 hover:bg-gray-700 rounded-full">
                        <Plus />
                    </Button>
                    <Input
                        placeholder="Ask VEDA or paste content to verify..."
                        className="flex-1 bg-transparent border-none text-lg text-gray-200 placeholder-gray-500 focus:ring-0 focus:outline-none"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAnalysis()}
                        disabled={isLoading}
                    />
                    <Button variant="ghost" size="icon" className="text-gray-400 hover:bg-gray-700 rounded-full">
                        <Mic />
                    </Button>
                    <Button size="icon" className="bg-gray-700 hover:bg-gray-600 rounded-full" onClick={handleAnalysis} disabled={isLoading || !inputValue.trim()}>
                        {isLoading ? <Spinner /> : <ArrowUp />}
                    </Button>
                </div>
                 <p className="text-xs text-gray-500 mt-2 text-center">
                    VEDA may display inaccurate info. Always verify important information.
                </p>
             </div>
             { !analysisResult && !isLoading && 
                <div className="w-full mt-8">
                    <h2 className="text-2xl font-bold text-center mb-6">Spotlight</h2>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {spotlightNews.map((item, index) => <SpotlightCard key={index} item={item} />)}
                    </div>
                </div>
             }
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

          <main className="flex-1 flex flex-col">
            <div className="flex-1 p-6 overflow-y-auto flex">
              {renderMainContent()}
            </div>
          </main>
        </div>
      </DashboardViewContext.Provider>
    </SidebarProvider>
  );
}
