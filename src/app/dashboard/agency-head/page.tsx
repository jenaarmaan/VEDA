
'use client';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState, useMemo } from 'react';
import type { Report, Task, UserProfile } from '@/lib/types';
import { getAllReports, getTasksForAgency, getUsersInAgency, assignTask } from '@/lib/firestore';
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
import { Bell, ChevronDown, Filter, HelpCircle, History, Menu, Settings } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';

type ReportStatus = 'Queued' | 'Verified' | 'Re-Verification' | 'Under Review' | 'Cleared';

export default function AgencyHeadDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [agencyUsers, setAgencyUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [assignee, setAssignee] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'All'>('All');
  const [sortFilter, setSortFilter] = useState<'Newest' | 'Oldest'>('Newest');

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      setLoading(true);
      try {
        const [reportsData, usersData] = await Promise.all([
          getAllReports(), // Assuming agency head sees all reports for assignment
          getUsersInAgency(user.location)
        ]);
        setReports(reportsData);
        setAgencyUsers(usersData.filter(u => u.uid !== user.uid));
      } catch (error) {
        console.error("Error fetching agency data: ", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch agency data.' });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user, toast]);
  
  const filteredAndSortedReports = useMemo(() => {
    let filtered = reports;
    if (statusFilter !== 'All') {
        filtered = filtered.filter(report => report.status === statusFilter);
    }
    
    return filtered.sort((a, b) => {
        if(sortFilter === 'Newest') {
            return b.createdAt - a.createdAt;
        }
        return a.createdAt - b.createdAt;
    });
  }, [reports, statusFilter, sortFilter]);


  const handleAssignTask = async () => {
      if(!user || !selectedReport || !assignee) return;
      setIsAssigning(true);
      try {
        const assignedToUser = agencyUsers.find(u => u.uid === assignee);
        if(!assignedToUser) throw new Error("Assignee not found");

        await assignTask({
            reportId: selectedReport.id,
            assignedBy: user.uid,
            assignedTo: assignee,
            department: assignedToUser.department || 'General',
            agency: user.location,
        });
        toast({title: "Success", description: "Task assigned successfully."});
        setSelectedReport(null);
        setAssignee('');
        // Optimistically update report status
        setReports(prev => prev.map(r => r.id === selectedReport.id ? {...r, status: 'Under Review'} : r));
      } catch (error) {
        console.error("Error assigning task:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to assign task.' });
      } finally {
        setIsAssigning(false);
      }
  }
  
  const getStatusVariant = (status: Report['status']) => {
    switch (status) {
      case 'Queued': return 'secondary';
      case 'Under Review': return 'default';
      case 'Verified':
      case 'Cleared': return 'outline';
      case 'Re-Verification': return 'destructive';
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
                      <Link href="/dashboard/agency-head">VEDA</Link>
                  </Button>
              </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton><History /> Investigations</SidebarMenuButton>
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
          <header className="flex items-center justify-between p-4 border-b border-border">
            <Menu className="md:hidden" /> {/* Placeholder for mobile sidebar toggle */}
            <div className="flex-1" />
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Avatar className="cursor-pointer">
                        <AvatarImage src={`https://i.pravatar.cc/150?u=${user?.uid}`} />
                        <AvatarFallback>{user?.name?.[0]}</AvatarFallback>
                    </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>{user?.name}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>Manage your account</DropdownMenuItem>
                    <DropdownMenuItem>Add account</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>Sign out</DropdownMenuItem>
                </DropdownMenuContent>
             </DropdownMenu>
          </header>

          <div className="flex-1 grid grid-cols-1 md:grid-cols-[400px_1fr] lg:grid-cols-[450px_1fr] xl:grid-cols-[500px_1fr] overflow-hidden">
            {/* Middle Pane - Cases List */}
            <div className="flex flex-col border-r border-border overflow-y-auto">
                <div className="p-4 border-b border-border">
                    <h2 className="text-xl font-semibold">Incoming Cases</h2>
                    <div className="flex gap-2 mt-4">
                        <Select onValueChange={(v: 'Newest' | 'Oldest') => setSortFilter(v)} defaultValue='Newest'>
                            <SelectTrigger className="w-full"> <SelectValue placeholder="Sort By" /> </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Newest">Newest to Oldest</SelectItem>
                                <SelectItem value="Oldest">Oldest to Newest</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select onValueChange={(v: ReportStatus | 'All') => setStatusFilter(v)} defaultValue="All">
                             <SelectTrigger className="w-full"> <SelectValue placeholder="Filter by Status" /> </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="All">All Statuses</SelectItem>
                                <SelectItem value="Queued">Queued</SelectItem>
                                <SelectItem value="Verified">Verified</SelectItem>
                                <SelectItem value="Re-Verification">Re-Verification</SelectItem>
                                <SelectItem value="Under Review">Under Review</SelectItem>
                                <SelectItem value="Cleared">Cleared</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                {loading ? <div className="p-4"><Spinner/></div> : (
                    <ul className="flex-1 overflow-y-auto">
                        {filteredAndSortedReports.map(report => (
                            <li key={report.id} onClick={() => setSelectedReport(report)} className={`p-4 border-b border-border cursor-pointer hover:bg-muted/50 ${selectedReport?.id === report.id ? 'bg-muted' : ''}`}>
                                <div className="flex justify-between items-start">
                                    <p className="font-semibold truncate pr-4">{report.contentData}</p>
                                    <Badge variant={getStatusVariant(report.status)} className="text-xs shrink-0">{report.status}</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">Case ID: {report.id.substring(0,8)}...</p>
                                <p className="text-sm text-muted-foreground">Date: {new Date(report.createdAt).toLocaleDateString()}</p>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Right Pane - Case Details */}
            <div className="flex flex-col overflow-y-auto p-6">
                {selectedReport ? (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold">Case Details: {selectedReport.id.substring(0,8)}</h2>
                    <Separator/>

                    <Card>
                        <CardHeader><CardTitle>Original Submission</CardTitle></CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-2">Submitted by: {selectedReport.submittedBy.substring(0,8)}...</p>
                            <p className="p-4 bg-muted rounded-md">{selectedReport.contentData}</p>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader><CardTitle>Initial Investigation</CardTitle></CardHeader>
                        <CardContent>
                            <Textarea placeholder="Enter findings, sources of spread (server, city, person), and other notes..."/>
                            <Button className="mt-4">Submit Initial Report</Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>Case Assignment</CardTitle></CardHeader>
                        <CardContent>
                           <div className="space-y-4">
                             <Select onValueChange={setAssignee} value={assignee}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Allot case to a state officer" />
                                </SelectTrigger>
                                <SelectContent>
                                    {agencyUsers.map(au => <SelectItem key={au.uid} value={au.uid}>{au.name} ({au.department || 'Employee'})</SelectItem>)}
                                </SelectContent>
                            </Select>
                             <Button onClick={handleAssignTask} disabled={isAssigning || !assignee}>
                                {isAssigning ? <Spinner/> : "Assign & Notify"}
                            </Button>
                           </div>
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
