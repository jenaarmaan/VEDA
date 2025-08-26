'use client';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import type { Task, UserProfile } from '@/lib/types';
import { getTasksForDepartment, getUsersInDepartment, reassignTask } from '@/lib/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Spinner from '@/components/shared/Spinner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

export default function DepartmentHeadDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [departmentUsers, setDepartmentUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [assignee, setAssignee] = useState('');
  const [isReassigning, setIsReassigning] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!user || !user.department) return;
      setLoading(true);
      try {
        const [tasksData, usersData] = await Promise.all([
          getTasksForDepartment(user.location, user.department),
          getUsersInDepartment(user.location, user.department)
        ]);
        setTasks(tasksData);
        setDepartmentUsers(usersData);
      } catch (error) {
        console.error("Error fetching department data: ", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch department data.' });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user, toast]);

  const handleReassignTask = async () => {
    if (!user || !selectedTask || !assignee) return;
    setIsReassigning(true);
    try {
      await reassignTask(selectedTask.id, assignee, user.uid);
      toast({ title: "Success", description: "Task reassigned successfully." });
      
      // Update local state
      setTasks(tasks.map(t => t.id === selectedTask.id ? { ...t, assignedTo: assignee } : t));
      
      setSelectedTask(null);
      setAssignee('');
    } catch (error) {
      console.error("Error reassigning task:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to reassign task.' });
    } finally {
      setIsReassigning(false);
    }
  };

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
          <CardTitle>Department Head Dashboard</CardTitle>
          <CardDescription>Manage your department's tasks and assignments.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-40"><Spinner /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task ID</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => {
                  const assignedUser = departmentUsers.find(u => u.uid === task.assignedTo) || { name: 'N/A' };
                  return (
                    <TableRow key={task.id}>
                      <TableCell>{task.id.substring(0, 8)}...</TableCell>
                      <TableCell>{assignedUser.name}</TableCell>
                      <TableCell><Badge variant={getStatusVariant(task.status)}>{task.status}</Badge></TableCell>
                      <TableCell>{new Date(task.updatedAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Dialog onOpenChange={(open) => !open && setSelectedTask(null)}>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline" onClick={() => setSelectedTask(task)}>Re-assign</Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Re-assign Task {selectedTask?.id.substring(0, 8)}</DialogTitle>
                            </DialogHeader>
                            <div className="py-4">
                              <Select onValueChange={setAssignee} value={assignee}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select an employee" />
                                </SelectTrigger>
                                <SelectContent>
                                  {departmentUsers.map(du => <SelectItem key={du.uid} value={du.uid}>{du.name}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                            <Button onClick={handleReassignTask} disabled={isReassigning || !assignee}>
                              {isReassigning ? <Spinner /> : "Confirm Re-assignment"}
                            </Button>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
