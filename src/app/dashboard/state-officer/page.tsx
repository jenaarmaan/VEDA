
'use client';

import { useState, useEffect } from 'react';
import { Sidebar, SidebarProvider, SidebarHeader, SidebarContent, SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Plus, Users, Settings, HelpCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { getTasksForAgency, getUsersInAgency, assignTask, updateTaskStatus, reassignTask } from '@/lib/firestore';
import type { Task, UserProfile } from '@/lib/types';
import Spinner from '@/components/shared/Spinner';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';


const TaskDetails = ({ task, users, onUpdate, onReassign, onClose }: { task: Task | null, users: UserProfile[], onUpdate: (taskId: string, status: Task['status']) => void, onReassign: (taskId: string, newAssignedTo: string) => void, onClose: () => void }) => {
  const [newAssignedTo, setNewAssignedTo] = useState('');

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
          <h4 className="font-semibold">Assigned To</h4>
          <p>{users.find(u => u.uid === task.assignedTo)?.details.fullName || task.assignedTo}</p>
        </div>
        <div>
          <h4 className="font-semibold">Department</h4>
          <p>{task.department}</p>
        </div>
         <div>
          <h4 className="font-semibold">Timeline</h4>
          <p>Created: {new Date(task.createdAt).toLocaleString()}</p>
          <p>Last Updated: {new Date(task.updatedAt).toLocaleString()}</p>
        </div>
        <div>
            <h4 className="font-semibold mb-2">Reassign Task</h4>
            <div className="flex gap-2">
                <Select onValueChange={setNewAssignedTo}>
                    <SelectTrigger><SelectValue placeholder="Select Officer" /></SelectTrigger>
                    <SelectContent>
                        {users.map(user => <SelectItem key={user.uid} value={user.uid}>{user.details.fullName}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Button onClick={() => onReassign(task.id, newAssignedTo)} disabled={!newAssignedTo}>Reassign</Button>
            </div>
        </div>
      </CardContent>
    </Card>
  );
};

const TaskList = ({ tasks, onTaskSelect, users }: { tasks: Task[], onTaskSelect: (task: Task) => void, users: UserProfile[] }) => {
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortOrder, setSortOrder] = useState('newest');

    const filteredAndSortedTasks = tasks
        .filter(task => statusFilter === 'all' || task.status === statusFilter)
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
                <CardTitle>State Cases</CardTitle>
                <div className="flex gap-4 mt-2">
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
                            <TableHead>Assigned To</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Last Updated</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredAndSortedTasks.length > 0 ? (
                          filteredAndSortedTasks.map(task => (
                              <TableRow key={task.id} onClick={() => onTaskSelect(task)} className="cursor-pointer">
                                  <TableCell className="font-medium">{task.reportId.substring(0, 8)}</TableCell>
                                  <TableCell>{users.find(u => u.uid === task.assignedTo)?.details.fullName || 'N/A'}</TableCell>
                                  <TableCell><Badge variant={getStatusVariant(task.status)}>{task.status}</Badge></TableCell>
                                  <TableCell>{new Date(task.updatedAt).toLocaleDateString()}</TableCell>
                              </TableRow>
                          ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center">No tasks found.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};

const TeamManagement = ({ users, onAddUser, onRemoveUser }: { users: UserProfile[], onAddUser: (user: any) => void, onRemoveUser: (userId: string) => void }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    
    const handleAdd = () => {
        onAddUser({ name, email, phone });
        setName(''); setEmail(''); setPhone('');
    };

    return (
        <div className="p-4">
            <h3 className="text-lg font-semibold mb-4">Team Members</h3>
            <div className="space-y-2 mb-6">
                {users.map(user => (
                    <div key={user.uid} className="flex justify-between items-center p-2 bg-muted rounded-md">
                        <div>
                            <p className="font-medium">{user.details.fullName}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                        <Button variant="destructive" size="sm" onClick={() => onRemoveUser(user.uid)}>Remove</Button>
                    </div>
                ))}
            </div>
            <Dialog>
                <DialogTrigger asChild>
                    <Button className="w-full"><Plus className="mr-2 h-4 w-4" /> Add Teammate</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader><DialogTitle>Add New Teammate</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                        <Input placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} />
                        <Input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
                        <Input placeholder="Phone" value={phone} onChange={e => setPhone(e.target.value)} />
                        <Button onClick={handleAdd}>Add Teammate</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};


export default function StateOfficerDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('investigations');
  const { toast } = useToast();

  const fetchData = async () => {
    if (!user || !user.details.state) return;
    setLoading(true);
    try {
      const agencyTasks = await getTasksForAgency(user.details.state);
      setTasks(agencyTasks);
      const agencyUsers = await getUsersInAgency(user.details.state);
      setUsers(agencyUsers);
    } catch (error) {
      console.error(error);
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
  
  const handleUpdateStatus = async (taskId: string, status: Task['status']) => {
    if(!user) return;
    try {
        await updateTaskStatus(taskId, status, user.uid);
        toast({ title: "Success", description: "Task status updated." });
        if(selectedTask?.id === taskId) {
            setSelectedTask(prev => prev ? {...prev, status, updatedAt: Date.now()} : null);
        }
        fetchData(); // Refresh data
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const handleReassignTask = async (taskId: string, newAssignedTo: string) => {
    if(!user) return;
    try {
        await reassignTask(taskId, newAssignedTo, user.uid);
        toast({ title: "Success", description: "Task reassigned." });
         if(selectedTask?.id === taskId) {
            setSelectedTask(prev => prev ? {...prev, assignedTo: newAssignedTo, updatedAt: Date.now()} : null);
        }
        fetchData();
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };


  const renderContent = () => {
    if (loading) return <div className="flex justify-center items-center h-full"><Spinner /></div>;
    
    switch(activeView) {
        case 'investigations':
            return (
                 <div className={cn("grid gap-6 transition-all duration-300", selectedTask ? "lg:grid-cols-2" : "lg:grid-cols-1")}>
                    <div className="col-span-1">
                       <TaskList tasks={tasks} onTaskSelect={setSelectedTask} users={users} />
                    </div>
                    {selectedTask && (
                        <div className="col-span-1">
                          <TaskDetails 
                            task={selectedTask} 
                            users={users}
                            onUpdate={handleUpdateStatus} 
                            onReassign={handleReassignTask} 
                            onClose={() => setSelectedTask(null)} 
                          />
                        </div>
                    )}
                </div>
            );
        case 'team':
            return <TeamManagement users={users} onAddUser={() => {}} onRemoveUser={() => {}} />;
        default:
            return <div>Select a view</div>;
    }
  }


  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background">
        <Sidebar>
          <SidebarHeader>
            <h2 className="text-lg font-semibold">VEDA State Officer</h2>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => setActiveView('investigations')} isActive={activeView === 'investigations'}>Investigations</SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => setActiveView('team')} isActive={activeView === 'team'}>
                  <Users className="mr-2 h-4 w-4" /> Team Details
                </SidebarMenuButton>
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
            <h1 className="text-2xl font-bold capitalize">{activeView}</h1>
          </header>
          {renderContent()}
        </main>
      </div>
    </SidebarProvider>
  );
}
