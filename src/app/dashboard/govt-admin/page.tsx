
'use client';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState, useMemo } from 'react';
import type { Report, Task, UserProfile } from '@/lib/types';
import { getAllReports, getAllTasks, getUsersInAgency, getTasksForAgency } from '@/lib/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Spinner from '@/components/shared/Spinner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter, SidebarProvider } from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bell, ChevronDown, Filter, HelpCircle, History, Menu, Settings, Mail } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';

type TaskStatus = 'Pending' | 'In Progress' | 'Resolved';

export default function GovtAdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  const [stateFilter, setStateFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'All'>('All');
  const [sortFilter, setSortFilter] = useState<'Newest' | 'Oldest'>('Newest');

  const allStates = useMemo(() => ['All', ...Array.from(new Set(tasks.map(t => t.agency)))], [tasks]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [tasksData, reportsData] = await Promise.all([
          getAllTasks(),
          getAllReports(),
        ]);
        setTasks(tasksData);
        setReports(reportsData);
      } catch (error) {
        console.error("Error fetching admin data: ", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch system-wide data.' });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [toast]);
  
  const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks;

    if (stateFilter !== 'All') {
        filtered = filtered.filter(task => task.agency === stateFilter);
    }
    if (statusFilter !== 'All') {
        filtered = filtered.filter(task => task.status === statusFilter);
    }
    
    return filtered.sort((a, b) => {
        if (sortFilter === 'Newest') {
            return b.createdAt - a.createdAt;
        }
        return a.createdAt - b.createdAt;
    });
  }, [tasks, stateFilter, statusFilter, sortFilter]);

  const selectedReport = useMemo(() => {
      if (!selectedTask) return null;
      return reports.find(r => r.id === selectedTask.reportId) || null;
  }, [selectedTask, reports]);

  const getStatusVariant = (status: Task['status']) => {
    switch (status) {
      case 'Pending': return 'secondary';
      case 'In Progress': return 'default';
      case 'Resolved': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <SidebarProvider>
    <div className="flex min-h-screen bg-[#131314] text-gray-200">
      <Sidebar>
          <SidebarHeader>
              <div className="flex items-center gap-2">
                  <Button asChild variant="ghost" size="icon" className="w-10 h-10">
                      <Link href="/dashboard/govt-admin">VEDA</Link>
                  </Button>
              </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton isActive><History /> Monitoring</SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
             <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton><HelpCircle /> Help</SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton><Settings /> Settings</SidebarMenuButton>
                </SidebarMenuItem>
             </SidebarMenu>
          </SidebarFooter>
      </Sidebar>
      <main className="flex-1 flex flex-col">
          <header className="flex items-center justify-end p-4 border-b border-border gap-4">
            <Button variant="link" asChild><Link href="/about">About</Link></Button>
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Avatar className="cursor-pointer">
                        <AvatarImage src={`https://i.pravatar.cc/150?u=${user?.uid}`} />
                        <AvatarFallback>{user?.name?.[0]}</AvatarFallback>
                    </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>Manage your account</DropdownMenuItem>
                    <DropdownMenuItem>Add account</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>Sign out</DropdownMenuItem>
                </DropdownMenuContent>
             </DropdownMenu>
          </header>

          <div className="flex-1 grid grid-cols-1 md:grid-cols-[400px_1fr] lg:grid-cols-[450px_1fr] xl:grid-cols-[500px_1fr] overflow-hidden">
            {/* Middle Pane - Cases Monitor */}
            <div className="flex flex-col border-r border-border overflow-y-auto">
                <div className="p-4 border-b border-border">
                    <h2 className="text-xl font-semibold">State Cases Monitor</h2>
                    <div className="grid grid-cols-2 gap-2 mt-4">
                        <Select onValueChange={(v: 'Newest' | 'Oldest') => setSortFilter(v)} defaultValue='Newest'>
                            <SelectTrigger> <SelectValue placeholder="Sort By" /> </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Newest">Newest to Oldest</SelectItem>
                                <SelectItem value="Oldest">Oldest to Newest</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select onValueChange={setStateFilter} defaultValue="All">
                             <SelectTrigger> <SelectValue placeholder="Filter by State" /> </SelectTrigger>
                            <SelectContent>
                                {allStates.map(state => <SelectItem key={state} value={state}>{state}</SelectItem>)}
                            </SelectContent>
                        </Select>
                         <Select onValueChange={(v: TaskStatus | 'All') => setStatusFilter(v)} defaultValue="All">
                             <SelectTrigger className="col-span-2"> <SelectValue placeholder="Filter by Status" /> </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="All">All Statuses</SelectItem>
                                <SelectItem value="Pending">Pending</SelectItem>
                                <SelectItem value="In Progress">In Progress</SelectItem>
                                <SelectItem value="Resolved">Resolved</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                {loading ? <div className="p-4"><Spinner/></div> : (
                    <ul className="flex-1 overflow-y-auto">
                        {filteredAndSortedTasks.map(task => (
                            <li key={task.id} onClick={() => setSelectedTask(task)} className={`p-4 border-b border-border cursor-pointer hover:bg-muted/50 ${selectedTask?.id === task.id ? 'bg-muted' : ''}`}>
                                <div className="flex justify-between items-start">
                                    <p className="font-semibold truncate pr-4">Report ID: {task.reportId.substring(0,8)}...</p>
                                    <Badge variant={getStatusVariant(task.status)} className="text-xs shrink-0">{task.status}</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">State: {task.agency}</p>
                                <p className="text-sm text-muted-foreground">Date: {new Date(task.createdAt).toLocaleDateString()}</p>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Right Pane - Case Details / Communication */}
            <div className="flex flex-col overflow-y-auto p-6">
                {selectedTask && selectedReport ? (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold">Case Details: {selectedReport.id.substring(0,8)}</h2>
                    <Separator/>

                    <Card>
                        <CardHeader><CardTitle>Submitted Report</CardTitle></CardHeader>
                        <CardContent>
                            <p className="p-4 bg-muted rounded-md">{selectedReport.contentData}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>AI Analysis</CardTitle></CardHeader>
                         <CardContent className="space-y-2">
                            <p><strong>Verdict:</strong> <Badge variant={selectedReport.aiVerdict === 'Fake' ? 'destructive' : 'default'}>{selectedReport.aiVerdict}</Badge></p>
                            <p><strong>Confidence:</strong> {selectedReport.aiConfidenceScore}%</p>
                         </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader><CardTitle>Communication</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <Textarea placeholder="Enter a message for the assigned officers..."/>
                            <Button><Mail className="mr-2"/> Notify Officers</Button>
                        </CardContent>
                    </Card>
                  </div>
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-muted-foreground">Select a case to view details</p>
                    </div>
                )}
            </div>
          </div>
      </main>
    </div>
    </SidebarProvider>
  );
}

    