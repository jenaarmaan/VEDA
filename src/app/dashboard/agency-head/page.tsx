'use client';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react';
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

export default function AgencyHeadDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [agencyUsers, setAgencyUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [assignee, setAssignee] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      setLoading(true);
      try {
        const [reportsData, tasksData, usersData] = await Promise.all([
          getAllReports(),
          getTasksForAgency(user.location),
          getUsersInAgency(user.location)
        ]);
        setReports(reportsData);
        setTasks(tasksData);
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
        // Refresh tasks
        const tasksData = await getTasksForAgency(user.location);
        setTasks(tasksData);
      } catch (error) {
        console.error("Error assigning task:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to assign task.' });
      } finally {
        setIsAssigning(false);
      }
  }
  
  const getStatusVariant = (status: Task['status']) => {
    switch (status) {
      case 'Pending':
        return 'secondary';
      case 'In Progress':
        return 'default';
      case 'Resolved':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="container py-12">
      <Card>
        <CardHeader>
          <CardTitle>Agency Head Dashboard</CardTitle>
          <CardDescription>Management portal for agency operations.</CardDescription>
        </CardHeader>
        <CardContent>
           <Tabs defaultValue="reports">
            <TabsList>
              <TabsTrigger value="reports">Incoming Reports</TabsTrigger>
              <TabsTrigger value="tasks">Assigned Tasks</TabsTrigger>
            </TabsList>
            <TabsContent value="reports">
               {loading ? <Spinner /> : (
                 <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Case ID</TableHead>
                      <TableHead>Content Type</TableHead>
                      <TableHead>AI Verdict</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell>{report.id.substring(0, 8)}...</TableCell>
                        <TableCell>{report.contentType}</TableCell>
                        <TableCell><Badge variant={report.aiVerdict === 'Fake' ? 'destructive' : 'default'}>{report.aiVerdict}</Badge></TableCell>
                        <TableCell>{new Date(report.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                           <Dialog onOpenChange={(open) => !open && setSelectedReport(null)}>
                            <DialogTrigger asChild>
                                <Button size="sm" onClick={() => setSelectedReport(report)}>Assign</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Assign Task for Report {selectedReport?.id.substring(0,8)}</DialogTitle>
                                    <DialogDescription>Select an agency member to investigate this report.</DialogDescription>
                                </DialogHeader>
                                <div className="py-4">
                                    <Select onValueChange={setAssignee} value={assignee}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Department Head or Employee" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {agencyUsers.map(au => <SelectItem key={au.uid} value={au.uid}>{au.name} ({au.role})</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button onClick={handleAssignTask} disabled={isAssigning || !assignee}>
                                    {isAssigning ? <Spinner/> : "Confirm Assignment"}
                                </Button>
                            </DialogContent>
                           </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
               )}
            </TabsContent>
             <TabsContent value="tasks">
                 {loading ? <Spinner /> : (
                 <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task ID</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tasks.map((task) => {
                       const assignedUser = agencyUsers.find(u => u.uid === task.assignedTo);
                       return (
                         <TableRow key={task.id}>
                          <TableCell>{task.id.substring(0, 8)}...</TableCell>
                          <TableCell>{assignedUser?.name || 'N/A'}</TableCell>
                          <TableCell>{task.department}</TableCell>
                          <TableCell><Badge variant={getStatusVariant(task.status)}>{task.status}</Badge></TableCell>
                          <TableCell>{new Date(task.updatedAt).toLocaleDateString()}</TableCell>
                        </TableRow>
                       )
                    })}
                  </TableBody>
                </Table>
               )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
