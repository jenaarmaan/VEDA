'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getAuditLogs } from '@/lib/firestore';
import type { AuditLog } from '@/lib/types';
import Spinner from '@/components/shared/Spinner';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { DateRange } from 'react-day-picker';

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [userIdFilter, setUserIdFilter] = useState('');
  const [reportIdFilter, setReportIdFilter] = useState('');
  const [date, setDate] = useState<DateRange | undefined>();
  const { toast } = useToast();

  const fetchLogs = async (filters = {}) => {
    setLoading(true);
    try {
      const auditLogs = await getAuditLogs(filters);
      setLogs(auditLogs);
    } catch (error) {
      console.error("Error fetching audit logs: ", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch audit logs.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleFilter = () => {
    const filters = {
      userId: userIdFilter,
      reportId: reportIdFilter,
      startDate: date?.from,
      endDate: date?.to,
    };
    fetchLogs(filters);
  };
  
  const handleClear = () => {
    setUserIdFilter('');
    setReportIdFilter('');
    setDate(undefined);
    fetchLogs();
  }

  return (
    <div className="container py-12">
      <Card>
        <CardHeader>
          <CardTitle>System Audit Log</CardTitle>
          <CardDescription>Review all actions performed across the system.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6 p-4 border rounded-lg">
            <Input
              placeholder="Filter by User ID..."
              value={userIdFilter}
              onChange={(e) => setUserIdFilter(e.target.value)}
              className="max-w-xs"
            />
            <Input
              placeholder="Filter by Report ID..."
              value={reportIdFilter}
              onChange={(e) => setReportIdFilter(e.target.value)}
              className="max-w-xs"
            />
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  className={cn(
                    "w-[300px] justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date?.from ? (
                    date.to ? (
                      <>
                        {format(date.from, "LLL dd, y")} -{" "}
                        {format(date.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(date.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={date?.from}
                  selected={date}
                  onSelect={setDate}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
            <Button onClick={handleFilter}>Apply Filters</Button>
            <Button onClick={handleClear} variant="ghost">Clear</Button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64"><Spinner /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Actor ID</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{new Date(log.timestamp.seconds * 1000).toLocaleString()}</TableCell>
                    <TableCell className="font-mono text-xs">{log.actorId}</TableCell>
                    <TableCell>{log.actionType}</TableCell>
                    <TableCell className="font-mono text-xs">{JSON.stringify(log.details)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
