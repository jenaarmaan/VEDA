
'use client';

import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Report, SpotlightItem } from '@/lib/types';
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
} from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { analyzeContent, AnalyzeContentInput, AnalyzeContentOutput } from '@/ai/flows/analyzeContentFlow';
import { useToast } from '@/hooks/use-toast';
import SpotlightCard from '@/components/dashboard/SpotlightCard';

type View = 'chat' | 'learn' | 'recent';

export default function GeneralUserDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [view, setView] = useState<View>('chat');
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalyzeContentOutput | null>(null);
  const [spotlightNews, setSpotlightNews] = useState<SpotlightItem[]>([
    // Placeholder data
    { type: 'real', title: 'Scientists Discover Breakthrough in Renewable Energy', summary: 'A new solar panel technology promises to double efficiency rates...', source: 'Science Today', verdict: 'True' },
    { type: 'fake', title: 'Warning: Viral Video Falsely Claims New Tax Law', summary: 'A widely circulated video is using deceptive edits to spread misinformation...', source: 'Internal Alert', verdict: 'Fake' },
    { type: 'real', title: 'Global Economic Summit Concludes with New Trade Agreements', summary: 'Leaders from 20 nations signed new pacts to promote fair trade...', source: 'Global Times', verdict: 'True' },
  ]);

  useEffect(() => {
    async function fetchReports() {
      if (!user) return;
      setLoadingHistory(true);
      try {
        const reportsRef = collection(db, 'reports');
        const q = query(
          reportsRef,
          where('submittedBy', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const userReports = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as Report));
        setReports(userReports);
      } catch (error) {
        console.error('Error fetching reports: ', error);
      } finally {
        setLoadingHistory(false);
      }
    }
    if (view === 'recent') {
      fetchReports();
    }
  }, [user, view]);

  const handleAnalysis = async () => {
    if (!inputValue.trim()) return;
    setIsLoading(true);
    setAnalysisResult(null);

    const input: AnalyzeContentInput = {
      contentType: 'text',
      contentData: inputValue,
    };

    try {
      const result = await analyzeContent(input);
      setAnalysisResult(result);
      setInputValue('');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description: 'Could not verify the content. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleShareAndReport = (result: AnalyzeContentOutput) => {
    const subject = `Fake News Report: Claim regarding "${result.justification.substring(0, 50)}..."`;
    const body = `
      Dear VEDA Authorities,

      I am reporting the following piece of information flagged as 'Fake' by the VEDA system.

      Original Content:
      "${inputValue}"

      AI Analysis Verdict: ${result.verdict}
      Confidence: ${result.confidenceScore}%

      Justification Provided:
      ${result.justification}

      Cited Sources:
      ${result.sources.join('\n')}

      Please investigate this matter further.

      Regards,
      A Concerned Citizen
    `;
    const mailtoLink = `mailto:veda.agencyhead@gmail.com?cc=veda.govt@gmail.com,support.veda@gmail.com&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
  };
  
  const getVerdictBadge = (verdict: AnalyzeContentOutput['verdict']) => {
    switch(verdict) {
      case 'True': return <Badge variant="default" className="bg-green-600 hover:bg-green-700"><CheckCircle className="mr-2 h-4 w-4" />True</Badge>;
      case 'Fake': return <Badge variant="destructive"><XCircle className="mr-2 h-4 w-4" />Fake</Badge>;
      case 'Unverifiable': return <Badge variant="secondary" className="bg-yellow-500 hover:bg-yellow-600 text-black"><AlertTriangle className="mr-2 h-4 w-4" />Suspicious</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
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
        return (
          <div className="w-full max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">Your Recent Verifications</h2>
            {loadingHistory ? <Spinner /> : (
              <div className="space-y-4">
                {reports.map(report => (
                  <Card key={report.id} className="bg-card/80">
                    <CardContent className="p-4">
                      <p className="truncate font-mono text-sm">{report.contentData}</p>
                      <div className="flex justify-between items-center mt-2">
                        <Badge variant={report.aiVerdict === 'True' ? 'default' : report.aiVerdict === 'Fake' ? 'destructive' : 'secondary'} className={report.aiVerdict === 'True' ? 'bg-green-600' : ''}>
                          {report.aiVerdict}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{new Date(report.createdAt).toLocaleString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        );
      case 'chat':
      default:
        return (
          <div className="w-full max-w-4xl flex flex-col items-center justify-center flex-grow">
            {!analysisResult && (
              <div className="text-center">
                <h1 className="text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 mb-4">
                  Namaste, Welcome to VEDA
                </h1>
                <p className="text-lg text-muted-foreground">Your personal assistant for verified information</p>
              </div>
            )}
            {analysisResult && (
              <div className="w-full mb-8 space-y-4">
                 <Card className="bg-card/80">
                    <CardHeader className="flex flex-row justify-between items-center">
                        <CardTitle>Verification Result</CardTitle>
                        {getVerdictBadge(analysisResult.verdict)}
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <h3 className="font-semibold mb-1">Explanation</h3>
                            <p className="text-sm text-muted-foreground">{analysisResult.justification}</p>
                        </div>
                         <div>
                            <h3 className="font-semibold mb-1">Sources</h3>
                            <ul className="list-disc pl-5 text-sm">
                                {analysisResult.sources.map((src, i) => <li key={i}><a href={src} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{src}</a></li>)}
                            </ul>
                        </div>
                        <div className="flex items-center gap-2 pt-4 border-t border-border">
                           <Button variant="ghost" size="icon"><ThumbsUp className="h-4 w-4" /></Button>
                           <Button variant="ghost" size="icon"><ThumbsDown className="h-4 w-4" /></Button>
                           <Button variant="ghost" size="icon"><RefreshCw className="h-4 w-4" /></Button>
                           <Button variant="ghost" size="icon" onClick={() => analysisResult.verdict === 'Fake' && handleShareAndReport(analysisResult)}><Share2 className="h-4 w-4" /></Button>
                           <Button variant="ghost" size="icon"><Copy className="h-4 w-4" /></Button>
                           <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                        </div>
                    </CardContent>
                 </Card>
              </div>
            )}
             <div className="w-full mt-auto">
                <div className="w-full max-w-4xl mx-auto px-4 py-2 bg-[#1e1f20] rounded-full flex items-center gap-2 border border-gray-700 focus-within:ring-2 focus-within:ring-primary transition-shadow">
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
             { !analysisResult && 
                <div className="w-full max-w-5xl mx-auto mt-16">
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
      <div className="flex min-h-screen bg-[#131314] text-gray-200">
        <Sidebar>
          <SidebarHeader />
          <SidebarContent className="p-2">
            <SidebarMenu>
              <SidebarMenuItem>
                <Button asChild variant="secondary" className="w-full justify-start text-base">
                  <Link href="/report/new">
                    <Plus className="mr-2 h-5 w-5" />
                    New Report
                  </Link>
                </Button>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => setView('learn')} isActive={view === 'learn'}>
                  <BookOpen />
                  Learn
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => setView('recent')} isActive={view === 'recent'}>
                  <History />
                  Recent
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Settings />
                  Settings
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col h-screen">
          <div className="flex-grow flex flex-col items-center justify-center p-6 overflow-y-auto">
            {renderMainContent()}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

    