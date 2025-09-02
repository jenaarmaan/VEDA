
'use client';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState, useMemo } from 'react';
import type { Report, Task, UserProfile } from '@/lib/types';
import { getTasksForAgency, getUsersInAgency, assignTaskToEmployee, addUserToAgency, removeUserFromAgency } from '@/lib/firestore';
import Spinner from '@/components/shared/Spinner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter, SidebarProvider, SidebarGroup, SidebarGroupLabel } from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bell, ChevronDown, Filter, HelpCircle, History, Menu, Settings, Plus, Trash2, UserPlus, X } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';


const addUserSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  position: z.string().min(2, "Position is required"),
  phone: z.string().min(10, "Phone number is required"),
});

export default function StateOfficerDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamMembers, setTeamMembers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [activeTab, setActiveTab] = useState('investigations');
  const [isAddUserOpen, setAddUserOpen] = useState(false);
  
  const form = useForm<z.infer<typeof addUserSchema>>({
    resolver: zodResolver(addUserSchema),
    defaultValues: { name: "", email: "", password: "", position: "", phone: "" },
  });

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      setLoading(true);
      try {
        const [tasksData, usersData] = await Promise.all([
          getTasksForAgency(user.location),
          getUsersInAgency(user.location)
        ]);
        setTasks(tasksData);
        setTeamMembers(usersData.filter(u => u.uid !== user.uid));
      } catch (error) {
        console.error("Error fetching state officer data: ", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch data.' });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user, toast]);
  
  const handleAddUser = async (values: z.infer<typeof addUserSchema>) => {
      if(!user) return;
      try {
          const newUser = await addUserToAgency({
              ...values,
              agency: user.location,
              role: 'agency_employee' // Or determine role dynamically
          });
          setTeamMembers([...teamMembers, newUser]);
          toast({title: "Success", description: "Team member added."});
          setAddUserOpen(false);
          form.reset();
      } catch (error) {
          console.error("Error adding user:", error);
          toast({ variant: 'destructive', title: 'Error', description: 'Failed to add team member.' });
      }
  };

  const handleRemoveUser = async (userId: string) => {
      if(!user) return;
      try {
          await removeUserFromAgency(userId);
          setTeamMembers(teamMembers.filter(m => m.uid !== userId));
          toast({title: "Success", description: "Team member removed."});
      } catch (error) {
          console.error("Error removing user:", error);
          toast({ variant: 'destructive', title: 'Error', description: 'Failed to remove team member.' });
      }
  };
  
  return (
    <SidebarProvider>
    <div className="flex min-h-screen bg-[#131314] text-gray-200">
      <Sidebar>
          <SidebarHeader>
              <div className="flex items-center gap-2">
                  <Button asChild variant="ghost" size="icon" className="w-10 h-10">
                      <a href="#">VEDA</a>
                  </Button>
              </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => setActiveTab('investigations')} isActive={activeTab === 'investigations'}><History /> Investigations</SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => setActiveTab('team')} isActive={activeTab === 'team'}><UserPlus /> Team Details</SidebarMenuButton>
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
            <Button variant="link">About</Button>
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

          <div className="flex-1 overflow-hidden">
            {activeTab === 'investigations' && (
                <div className="grid grid-cols-1 md:grid-cols-[400px_1fr] h-full">
                    {/* Cases List */}
                    <div className="flex flex-col border-r border-border overflow-y-auto">
                        <div className="p-4 border-b border-border">
                            <h2 className="text-xl font-semibold">Assigned Cases</h2>
                        </div>
                        {loading ? <div className="p-4"><Spinner/></div> : (
                            <ul className="flex-1 overflow-y-auto">
                                {tasks.map(task => (
                                    <li key={task.id} onClick={() => setSelectedTask(task)} className={`p-4 border-b border-border cursor-pointer hover:bg-muted/50 ${selectedTask?.id === task.id ? 'bg-muted' : ''}`}>
                                        <p className="font-semibold truncate pr-4">Report ID: {task.reportId.substring(0,8)}...</p>
                                        <p className="text-sm text-muted-foreground mt-1">Status: {task.status}</p>
                                        <p className="text-sm text-muted-foreground">Date: {new Date(task.createdAt).toLocaleDateString()}</p>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    {/* Case Details */}
                    <div className="flex flex-col overflow-y-auto p-6">
                        {selectedTask ? (
                          <div className="space-y-6">
                            <h2 className="text-2xl font-bold">Case Details: {selectedTask.reportId.substring(0,8)}</h2>
                            <Separator/>
                            <Card>
                                <CardHeader><CardTitle>Final Report Submission</CardTitle></CardHeader>
                                <CardContent>
                                    <Textarea placeholder="Write the final state-level investigation report here..."/>
                                    <Button className="mt-4">Submit Final Report</Button>
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
            )}
            {activeTab === 'team' && (
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold">Team Management</h2>
                        <Dialog open={isAddUserOpen} onOpenChange={setAddUserOpen}>
                            <DialogTrigger asChild>
                                <Button><Plus className="mr-2"/> Add Teammate</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader><DialogTitle>Add New Team Member</DialogTitle></DialogHeader>
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(handleAddUser)} className="space-y-4">
                                        <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name="password" render={({ field }) => (<FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name="position" render={({ field }) => (<FormItem><FormLabel>Position</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <Button type="submit" disabled={form.formState.isSubmitting}>
                                            {form.formState.isSubmitting ? <Spinner /> : "Add Member"}
                                        </Button>
                                    </form>
                                </Form>
                            </DialogContent>
                        </Dialog>
                    </div>
                     <Table>
                        <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Position</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {teamMembers.map(member => (
                                <TableRow key={member.uid}>
                                    <TableCell>{member.name}</TableCell>
                                    <TableCell>{member.department || 'N/A'}</TableCell>
                                    <TableCell>{member.email}</TableCell>
                                    <TableCell>{member.contact}</TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" onClick={() => handleRemoveUser(member.uid)}><Trash2 className="text-destructive"/></Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
          </div>
      </main>
    </div>
    </SidebarProvider>
  );
}
