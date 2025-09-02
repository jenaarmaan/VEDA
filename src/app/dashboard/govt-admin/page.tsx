
'use client';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState, useMemo } from 'react';
import type { Report, Task } from '@/lib/types';
import { getAllReports, getAllTasks } from '@/lib/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Spinner from '@/components/shared/Spinner';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Pie, PieChart, Cell } from 'recharts';
import { Button } from '@/components/ui/button';
import { Download, SlidersHorizontal } from 'lucide-react';
import Link from 'next/link';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function GovtAdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [reportsData, tasksData] = await Promise.all([
          getAllReports(),
          getAllTasks()
        ]);
        setReports(reportsData);
        setTasks(tasksData);
      } catch (error) {
        console.error("Error fetching admin data: ", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch system-wide data.' });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [toast]);

  const analytics = useMemo(() => {
    const reportVerdicts = reports.reduce((acc, report) => {
        acc[report.aiVerdict] = (acc[report.aiVerdict] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const taskStatuses = tasks.reduce((acc, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const topLocations = reports.reduce((acc, report) => {
        if (report.location) {
            acc[report.location] = (acc[report.location] || 0) + 1;
        }
        return acc;
    }, {} as Record<string, number>);
    
    const topSources = reports.flatMap(r => r.sources).reduce((acc, source) => {
        try {
            const hostname = new URL(source).hostname;
            acc[hostname] = (acc[hostname] || 0) + 1;
        } catch (e) {
            // ignore invalid URLs
        }
        return acc;
    }, {} as Record<string, number>);

    return {
        reportVerdictsData: Object.entries(reportVerdicts).map(([name, value]) => ({ name, value })),
        taskStatusesData: Object.entries(taskStatuses).map(([name, value]) => ({ name, value })),
        topLocationsData: Object.entries(topLocations).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => ({name, count})),
        topSourcesData: Object.entries(topSources).sort((a,b) => b[1] - a[1]).slice(0,5).map(([name, count]) => ({name, count}))
    };
  }, [reports, tasks]);
  
  const getStatusVariant = (status: Report['status'] | Task['status']) => {
    switch (status) {
      case 'Queued':
        return 'secondary';
      case 'Under Review':
      case 'In Progress':
        return 'default';
      case 'Verified':
      case 'Cleared':
      case 'Resolved':
        return 'outline';
      case 'Re-Verification':
        return 'destructive';
      default:
        return 'secondary';
    }
  };


  return (
    <div className="container py-12">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Government Admin Dashboard</CardTitle>
                    <CardDescription>System-wide monitoring and analytics portal.</CardDescription>
                </div>
                 <Button asChild variant="outline">
                    <Link href="/dashboard/admin/audit-log">
                        <SlidersHorizontal className="mr-2" />
                        Audit Log
                    </Link>
                </Button>
            </CardHeader>
            <CardContent>
                {loading ? <div className="flex justify-center items-center h-64"><Spinner /></div> :
                <Tabs defaultValue="overview">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="overview">Overview & Analytics</TabsTrigger>
                        <TabsTrigger value="reports">All Reports</TabsTrigger>
                        <TabsTrigger value="tasks">All Tasks</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="overview" className="mt-6">
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Reports by AI Verdict</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ChartContainer config={{}} className="min-h-[200px] w-full">
                                        <PieChart>
                                            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                                            <Pie data={analytics.reportVerdictsData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                                {analytics.reportVerdictsData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                        </PieChart>
                                    </ChartContainer>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Tasks by Status</CardTitle>
                                </CardHeader>
                                <CardContent>
                                     <ChartContainer config={{}} className="min-h-[200px] w-full">
                                        <BarChart data={analytics.taskStatusesData} layout="vertical" margin={{left: 20}}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis type="number" />
                                            <YAxis type="category" dataKey="name" width={80} />
                                            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                                            <Bar dataKey="value" fill="hsl(var(--primary))" radius={4} />
                                        </BarChart>
                                    </ChartContainer>
                                </CardContent>
                            </Card>
                             <Card className="col-span-1 md:col-span-2">
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle>Top Reporting Locations (Agencies)</CardTitle>
                                    <Button variant="outline" size="sm"><Download className="mr-2"/> Export CSV</Button>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader><TableRow><TableHead>Location/Agency</TableHead><TableHead className="text-right">Report Count</TableHead></TableRow></TableHeader>
                                        <TableBody>
                                            {analytics.topLocationsData.map(l => <TableRow key={l.name}><TableCell>{l.name}</TableCell><TableCell className="text-right">{l.count}</TableCell></TableRow>)}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                            <Card className="col-span-1 md:col-span-2">
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle>Most Common Misinformation Sources</CardTitle>
                                     <Button variant="outline" size="sm"><Download className="mr-2"/> Export CSV</Button>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader><TableRow><TableHead>Source Domain</TableHead><TableHead className="text-right">Occurrences</TableHead></TableRow></TableHeader>
                                        <TableBody>
                                            {analytics.topSourcesData.map(s => <TableRow key={s.name}><TableCell>{s.name}</TableCell><TableCell className="text-right">{s.count}</TableCell></TableRow>)}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="reports">
                        <Table>
                            <TableHeader><TableRow><TableHead>Case ID</TableHead><TableHead>Agency</TableHead><TableHead>Verdict</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {reports.map(r => (
                                    <TableRow key={r.id}>
                                        <TableCell>{r.id.substring(0,8)}...</TableCell>
                                        <TableCell>{r.location}</TableCell>
                                        <TableCell><Badge variant={r.aiVerdict === 'Fake' ? 'destructive' : 'default'}>{r.aiVerdict}</Badge></TableCell>
                                        <TableCell><Badge variant={getStatusVariant(r.status)}>{r.status}</Badge></TableCell>
                                        <TableCell>{new Date(r.createdAt).toLocaleDateString()}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TabsContent>

                    <TabsContent value="tasks">
                        <Table>
                            <TableHeader><TableRow><TableHead>Task ID</TableHead><TableHead>Agency</TableHead><TableHead>Department</TableHead><TableHead>Status</TableHead><TableHead>Updated</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {tasks.map(t => (
                                    <TableRow key={t.id}>
                                        <TableCell>{t.id.substring(0,8)}...</TableCell>
                                        <TableCell>{t.agency}</TableCell>
                                        <TableCell>{t.department}</TableCell>
                                        <TableCell><Badge variant={getStatusVariant(t.status)}>{t.status}</Badge></TableCell>
                                        <TableCell>{new Date(t.updatedAt).toLocaleDateString()}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TabsContent>

                </Tabs>
                }
            </CardContent>
        </Card>
    </div>
  );
}
