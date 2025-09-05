
'use client';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Report } from '@/lib/types';
import { Plus, Mic, ArrowUp, Settings, ToyBrick, Gamepad2, Search, BookOpen, FlaskConical, LifeBuoy, ChevronRight, History } from 'lucide-react';
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
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';


export default function GeneralUserDashboard() {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReports() {
      if (!user) return;
      setLoading(true);
      try {
        const reportsRef = collection(db, 'reports');
        const q = query(reportsRef, where('submittedBy', '==', user.uid), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const userReports = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Report));
        setReports(userReports);
      } catch (error) {
        console.error("Error fetching reports: ", error);
      } finally {
        setLoading(false);
      }
    }

    fetchReports();
  }, [user]);
  
  return (
    <SidebarProvider>
        <div className="flex min-h-screen bg-[#131314] text-gray-200">
            <Sidebar>
                <SidebarHeader>
                    <div className="flex items-center gap-2">
                        <Button asChild variant="ghost" size="icon" className="w-10 h-10">
                            <Link href="/dashboard/user">VEDA</Link>
                        </Button>
                    </div>
                </SidebarHeader>
                <SidebarContent className="p-2">
                    <SidebarMenu>
                         <SidebarMenuItem>
                            <Button asChild variant="secondary" className="w-full justify-start">
                                <Link href="/report/new">
                                    <Plus/>
                                    New Report
                                </Link>
                            </Button>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton>
                                <History />
                                Evidences
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                         <SidebarMenuItem>
                            <Collapsible>
                                <CollapsibleTrigger className="w-full">
                                    <SidebarMenuButton className="w-full group">
                                         <LifeBuoy />
                                         VEDA Hub
                                         <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-[state=open]:rotate-90" />
                                    </SidebarMenuButton>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                    <SidebarMenuSub>
                                        <SidebarGroup>
                                            <SidebarGroupLabel>FUN HUB</SidebarGroupLabel>
                                            <SidebarMenuSubItem>
                                                <SidebarMenuSubButton><ToyBrick/>FAST FACT CHECK</SidebarMenuSubButton>
                                            </SidebarMenuSubItem>
                                            <SidebarMenuSubItem>
                                                <SidebarMenuSubButton><Gamepad2/>DETECTIVE MODE</SidebarMenuSubButton>
                                            </SidebarMenuSubItem>
                                            <SidebarMenuSubItem>
                                                <SidebarMenuSubButton><Search/>SPOT THE FAKE</SidebarMenuSubButton>
                                            </SidebarMenuSubItem>
                                        </SidebarGroup>
                                        <SidebarGroup>
                                            <SidebarGroupLabel>KNOWLEDGE HUB</SidebarGroupLabel>
                                            <SidebarMenuSubItem>
                                                <SidebarMenuSubButton><BookOpen/>TRUTH GUIDES</SidebarMenuSubButton>
                                            </SidebarMenuSubItem>
                                            <SidebarMenuSubItem>
                                                <SidebarMenuSubButton><FlaskConical/>RESEARCH</SidebarMenuSubButton>
                                            </SidebarMenuSubItem>
                                        </SidebarGroup>
                                    </SidebarMenuSub>
                                </CollapsibleContent>
                            </Collapsible>
                        </SidebarMenuItem>
                    </SidebarMenu>
                    <div className="flex-grow mt-4">
                        <p className="px-4 text-sm font-semibold text-muted-foreground">Recent</p>
                         <div className="p-2 overflow-y-auto">
                            {loading ? <Spinner /> : reports.map(report => (
                                <SidebarMenuButton key={report.id} className="h-auto py-2 text-left">
                                    <span className="truncate text-sm">{report.contentData}</span>
                                </SidebarMenuButton>
                            ))}
                        </div>
                    </div>
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
                <div className="flex-grow flex flex-col items-center justify-center p-4">
                    <div className="w-full max-w-4xl flex flex-col items-center justify-center flex-grow">
                         <h1 className="text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 mb-12">
                            VEDA
                        </h1>
                        {/* This section can be used to display chat/report results */}
                    </div>

                    <div className="w-full max-w-4xl px-4 py-2 bg-[#1e1f20] rounded-full flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="text-gray-400 hover:bg-gray-700 rounded-full">
                            <Plus />
                        </Button>
                        <Input 
                            placeholder="Ask VEDA" 
                            className="flex-1 bg-transparent border-none text-lg text-gray-200 placeholder-gray-500 focus:ring-0 focus:outline-none"
                        />
                         <Button variant="ghost" size="icon" className="text-gray-400 hover:bg-gray-700 rounded-full">
                            <Mic />
                        </Button>
                        <Button size="icon" className="bg-gray-700 hover:bg-gray-600 rounded-full">
                            <ArrowUp />
                        </Button>
                    </div>
                     <p className="text-xs text-gray-500 mt-2">VEDA may display inaccurate info. Always verify important information.</p>
                </div>
            </main>
        </div>
    </SidebarProvider>
  );
}
