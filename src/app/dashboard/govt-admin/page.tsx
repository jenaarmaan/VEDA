
'use client';

import { useState, useEffect } from 'react';
import { Sidebar, SidebarProvider, SidebarHeader, SidebarContent, SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Settings, HelpCircle, Monitor } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { getAllTasks } from '@/lib/firestore';
import type { Task, UserProfile } from '@/lib/types';
import Spinner from '@/components/shared/Spinner';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const TaskDetails = ({ task, onClose }: { task: Task | null, onClose: () => void }) => {
  if (!task) return null;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-center">
            <CardTitle>Case ID: {task.reportId.substring(0, 8)}</CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>X</Button>
        </div>
        <CardDescription>Details for task {task.taskId.substring(0, 8)}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow overflow-y-auto space-y-4">
        <div>
          <h4 className="font-semibold">Status</h4>
          <p>{task.status}</p>
        </div>
        <div>
          <h4 className="font-semibold">Assigned To (UID)</h4>
          <p className="font-mono text-xs">{task.assignedTo}</p>
        </div>
        <div>
          <h4 className="font-semibold">Agency</h4>
          <p>{task.agency}</p>
        </div>
        <div>
          <h4 className="font-semibold">Timeline</h4>
          <p>Created: {new Date(task.createdAt).toLocaleString()}</p>
          <p>Last Updated: {new Date(task.updatedAt).toLocaleString()}</p>
        </div>
        <div className="pt-4">
            <h4 className="font-semibold mb-2">Send Communication</h4>
            <Textarea placeholder="Type your message to the assigned officers..." className="mb-2" />
            <Button>Send Message</Button>
        </div>
      </CardContent>
    </Card>
  );
};


const TaskList = ({ tasks, onTaskSelect }: { tasks: Task[], onTaskSelect: (task: Task) => void }) => {
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortOrder, setSortOrder] = useState('newest');
    const [stateFilter, setStateFilter] = useState('all');

    const states = [...new Set(tasks.map(task => task.agency))];

    const filteredAndSortedTasks = tasks
        .filter(task => statusFilter === 'all' || task.status === statusFilter)
        .filter(task => stateFilter === 'all' || task.agency === stateFilter)
        .sort((a, b) => {
            if (sortOrder === 'newest') return b.createdAt - a.createdAt;
            return a.createdAt - b.createdAt;
        });

    const getStatusVariant = (status: Task['status']) => {
        switch (status) {
            case 'Completed': return 'default';
            case 'In Progress': return 'secondary';
            case 'Pending': return 'outline';
            case 'Escalated': return 'destructive';
            default: return 'default';
        }
    };
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Nationwide Case Monitor</CardTitle>
                 <div className="flex flex-wrap gap-4 mt-2">
                    <Select value={stateFilter} onValueChange={setStateFilter}>
                        <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filter by State" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All States</SelectItem>
                            {states.map(state => <SelectItem key={state} value={state}>{state}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filter by status" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="In Progress">In Progress</SelectItem>
                            <SelectItem value="Completed">Completed</SelectItem>
                            <SelectItem value="Escalated">Escalated</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={sortOrder} onValueChange={setSortOrder}>
                        <SelectTrigger className="w-[180px]"><SelectValue placeholder="Sort by" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="newest">Newest to Oldest</SelectItem>
                            <SelectItem value="oldest">Oldest to Newest</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Case ID</TableHead>
                            <TableHead>State/Agency</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Last Updated</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredAndSortedTasks.map(task => (
                            <TableRow key={task.id} onClick={() => onTaskSelect(task)} className="cursor-pointer">
                                <TableCell className="font-medium">{task.reportId.substring(0, 8)}</TableCell>
                                <TableCell>{task.agency}</TableCell>
                                <TableCell><Badge variant={getStatusVariant(task.status)}>{task.status}</Badge></TableCell>
                                <TableCell>{new Date(task.updatedAt).toLocaleDateString()}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};


export default function MinistryDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const allTasks = await getAllTasks();
      setTasks(allTasks);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch data.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchData();
    }
  }, [user, authLoading]);


  const renderContent = () => {
    if (loading) return <div className="flex justify-center items-center h-full"><Spinner /></div>;
    
    return (
         <div className={cn("grid gap-6 transition-all duration-300", selectedTask ? "lg:grid-cols-2" : "lg:grid-cols-1")}>
            <div className="col-span-1">
                <TaskList tasks={tasks} onTaskSelect={setSelectedTask} />
            </div>
            {selectedTask && (
                <div className="col-span-1">
                    <TaskDetails task={selectedTask} onClose={() => setSelectedTask(null)} />
                </div>
            )}
        </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background">
        <Sidebar>
          <SidebarHeader>
            <h2 className="text-lg font-semibold">VEDA Ministry</h2>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton isActive={true}><Monitor className="mr-2 h-4 w-4" /> Monitoring</SidebarMenuButton>
              </SidebarMenuItem>
               <SidebarMenuItem>
                 <Link href="/dashboard/govt-admin/audit-log">
                    <SidebarMenuButton>Audit Log</SidebarMenuButton>
                 </Link>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton><Settings className="mr-2 h-4 w-4" /> Settings</SidebarMenuButton>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                    <SidebarMenuButton><HelpCircle className="mr-2 h-4 w-4" /> Help</SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 p-6">
          <header className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Dashboard</h1>
          </header>
          {renderContent()}
        </main>
      </div>
    </SidebarProvider>
  );
}
