'use client';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Report } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';
import Spinner from '@/components/shared/Spinner';

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
  
  const getBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'submitted':
        return 'secondary';
      case 'under investigation':
        return 'default';
      case 'resolved':
        return 'outline';
      default:
        return 'secondary';
    }
  };


  return (
    <div className="container py-12">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Welcome, {user?.name}</h1>
          <p className="text-muted-foreground">Here's an overview of your activity.</p>
        </div>
        <Button asChild>
          <Link href="/report/new">
            <FileText className="mr-2 h-4 w-4" />
            Submit New Report
          </Link>
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Your Submitted Reports</CardTitle>
          <CardDescription>A list of all the content you have submitted for verification.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <Spinner />
            </div>
          ) : reports.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Case ID</TableHead>
                  <TableHead>Content Type</TableHead>
                  <TableHead>Verdict</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">{report.id.substring(0, 8)}...</TableCell>
                    <TableCell>{report.contentType}</TableCell>
                    <TableCell>
                       <Badge variant={report.aiVerdict === 'Fake' ? 'destructive' : 'default'}>
                        {report.aiVerdict}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getBadgeVariant(report.status)}>{report.status}</Badge>
                    </TableCell>
                    <TableCell>{new Date(report.createdAt).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">You haven't submitted any reports yet.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
