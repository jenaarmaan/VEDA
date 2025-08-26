'use client';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import type { Task } from '@/lib/types';
import { getTasksForUser, updateTaskStatus } from '@/lib/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Spinner from '@/components/shared/Spinner';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

export default function AgencyEmployeeDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTasks() {
      if (!user) return;
      setLoading(true);
      try {
        const userTasks = await getTasksForUser(user.uid);
        setTasks(userTasks);
      } catch (error) {
        console.error("Error fetching tasks: ", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch tasks.' });
      } finally {
        setLoading(false);
      }
    }
    fetchTasks();
  }, [user, toast]);

  const handleStatusChange = async (taskId: string, newStatus: Task['status']) => {
    try {
        if(!user) return;
        await updateTaskStatus(taskId, newStatus, user.uid);
        setTasks(tasks.map(task => task.id === taskId ? { ...task, status: newStatus } : task));
        toast({ title: 'Success', description: 'Task status updated.' });
    } catch (error) {
        console.error('Failed to update task status:', error);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to update task status.' });
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
          <CardTitle>Your Assigned Tasks</CardTitle>
          <CardDescription>Manage and update the tasks assigned to you.</CardDescription>
        </CardHeader>
        <CardContent>
           {loading ? (
            <div className="flex justify-center items-center h-40">
              <Spinner />
            </div>
          ) : tasks.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task ID</TableHead>
                  <TableHead>Report ID</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium">{task.id.substring(0, 8)}...</TableCell>
                    <TableCell>{task.reportId.substring(0, 8)}...</TableCell>
                    <TableCell>{task.department}</TableCell>
                    <TableCell>
                       <Select 
                          defaultValue={task.status} 
                          onValueChange={(value: Task['status']) => handleStatusChange(task.id, value)}
                        >
                        <SelectTrigger className="w-[180px]">
                           <Badge variant={getStatusVariant(task.status)}>{task.status}</Badge>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="In Progress">In Progress</SelectItem>
                          <SelectItem value="Resolved">Resolved</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">You have no tasks assigned to you.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
